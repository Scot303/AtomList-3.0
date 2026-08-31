package atomdance.app.modules.person.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.paymentList.service.PaymentListService;
import atomdance.app.modules.person.dto.CreateUpdateFamilyRequest;
import atomdance.app.modules.person.dto.FamilyMemberView;
import atomdance.app.modules.person.dto.FamilyView;
import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.FamilyRepository;
import atomdance.app.modules.person.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class FamilyService {

	private final FamilyRepository familyRepository;
	private final PersonRepository personRepository;
	private final PaymentListService paymentListService;
	private final PersonService personService;
	private final AuditLogger auditLogger;


	public Family getOrThrow(UUID id) {
		return familyRepository.findByIdWithPersons(id)
				.orElseThrow(() -> new NotFoundException("entity.family"));
	}


	@Transactional(readOnly = true)
	public List<FamilyView> getAll() {
		return toViews(familyRepository.findAllWithPersons());
	}


	@Transactional(readOnly = true)
	public FamilyView get(UUID id) {
		auditLogger.read(AuditEventType.FAMILY_PREVIEW, id, "Previewed family data.");
		return toView(getOrThrow(id));
	}


	@Transactional
	public FamilyView create(CreateUpdateFamilyRequest request) {
		Family family = familyRepository.saveAndFlush(Family.builder()
				.name(request.name().trim())
				.phone(Person.normalizePhone(request.phone()))
				.note(request.note())
				.build());

		auditLogger.success(AuditEventType.FAMILY_MANAGEMENT, family.getId(), "Family %s has been created.", family.getName());

		return toView(family);
	}


	@Transactional
	public FamilyView update(UUID id, CreateUpdateFamilyRequest request) {
		Family family = getOrThrow(id);

		family.setName(request.name().trim());
		family.setPhone(Person.normalizePhone(request.phone()));
		family.setNote(request.note());

		auditLogger.success(AuditEventType.FAMILY_MANAGEMENT, family.getId(), "Family %s has been updated.", family.getName());

		return toView(family);
	}


	/**
	 * Replaces the whole roster with {@code personIds}: anybody in the list joins, anybody currently in the family but absent from it leaves. An empty list therefore empties the family.
	 * Both directions change the discount order for everybody involved, so every open list is rebuilt afterwards - see {@link PaymentListService#recalculateOpenStandardLists()}.
	 */
	@Transactional
	public FamilyView setMembers(UUID id, List<UUID> personIds) {
		Family family = getOrThrow(id);

		Set<UUID> targetIds = new LinkedHashSet<>(personIds);
		Set<UUID> currentIds = family.getPersons().stream().map(Person::getId).collect(Collectors.toCollection(LinkedHashSet::new));

		List<Person> removed = family.getPersons().stream()
				.filter(person -> !targetIds.contains(person.getId()))
				.toList();

		for (Person person : removed) {
			family.removePerson(person);
		}

		List<UUID> addedIds = targetIds.stream().filter(personId -> !currentIds.contains(personId)).toList();
		List<Person> added = addedIds.isEmpty() ? List.of() : personRepository.findAllByIdWithFamily(addedIds);

		if (added.size() != addedIds.size()) {
			throw new NotFoundException("entity.person");
		}

		for (Person person : added) {
			family.addPerson(person);
		}

		if (added.isEmpty() && removed.isEmpty()) {
			return toView(family);
		}

		paymentListService.recalculateOpenStandardLists();

		auditLogger.success(AuditEventType.FAMILY_MANAGEMENT, family.getId(), "Family %s roster updated: %s member(s) added, %s removed.",
				family.getName(),
				added.stream().map(Person::getFullName).toList(),
				removed.stream().map(Person::getFullName).toList());

		return toView(family);
	}


	@Transactional
	public void delete(UUID id) {
		Family family = getOrThrow(id);

		if (personRepository.countByFamilyId(id) > 0) {
			throw new InvalidOperationException("error.family_not_empty");
		}

		familyRepository.delete(family);

		auditLogger.success(AuditEventType.FAMILY_MANAGEMENT, family.getId(), "Family %s has been deleted.", family.getName());
	}


	private FamilyView toView(Family family) {
		return toViews(List.of(family)).getFirst();
	}


	private List<FamilyView> toViews(List<Family> families) {
		List<UUID> personIds = families.stream()
				.flatMap(family -> family.getPersons().stream())
				.map(Person::getId)
				.toList();

		Map<UUID, Set<UUID>> groupIds = personService.activeGroupIdsOf(personIds);

		return families.stream()
				.map(family -> FamilyView.of(family, person -> FamilyMemberView.of(person, groupIds.getOrDefault(person.getId(), Set.of()))))
				.toList();
	}
}
