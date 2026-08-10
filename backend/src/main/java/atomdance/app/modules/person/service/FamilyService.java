package atomdance.app.modules.person.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.discount.service.DiscountRules;
import atomdance.app.modules.discount.service.DiscountService;
import atomdance.app.modules.discount.service.FamilyPositions;
import atomdance.app.modules.finance.service.PaymentListService;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.dto.CreateUpdateFamilyRequest;
import atomdance.app.modules.person.dto.FamilyMemberView;
import atomdance.app.modules.person.dto.FamilyView;
import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.FamilyRepository;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyService {

	private final FamilyRepository familyRepository;
	private final PersonRepository personRepository;
	private final MembershipRepository membershipRepository;
	private final PaymentListService paymentListService;
	private final PersonService personService;
	private final DiscountService discountService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final AppClock clock;


	public Family getOrThrow(UUID id) {
		return familyRepository.findByIdWithPersons(id)
				.orElseThrow(() -> new NotFoundException("entity.family"));
	}


	@Transactional(readOnly = true)
	public List<FamilyView> getAll() {
		auditLogger.record(securityService.getCurrentUserId(), AuditEventType.FAMILY_PREVIEW, AuditOutcome.SUCCESS, "Previewed all families.");
		return toViews(familyRepository.findAllWithPersons());
	}


	@Transactional(readOnly = true)
	public FamilyView get(UUID id) {
		auditLogger.record(securityService.getCurrentUserId(), id, AuditEventType.FAMILY_PREVIEW, AuditOutcome.SUCCESS, "Previewed family data.");
		return toView(getOrThrow(id));
	}


	@Transactional
	public FamilyView create(CreateUpdateFamilyRequest request) {
		Family family = familyRepository.saveAndFlush(Family.builder()
				.name(request.name().trim())
				.phone(Person.normalizePhone(request.phone()))
				.note(request.note())
				.build());

		log.info("Created family {} ({})", family.getId(), family.getName());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family %s has been created.", family.getName()));

		return toView(family);
	}


	@Transactional
	public FamilyView update(UUID id, CreateUpdateFamilyRequest request) {
		Family family = getOrThrow(id);

		family.setName(request.name().trim());
		family.setPhone(Person.normalizePhone(request.phone()));
		family.setNote(request.note());

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family %s has been updated.", family.getName()));

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

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family %s roster updated: %d member(s) added, %d removed.", family.getName(), added.size(), removed.size()));

		return toView(family);
	}


	@Transactional
	public void delete(UUID id) {
		Family family = getOrThrow(id);

		if (personRepository.countByFamilyId(id) > 0) {
			throw new InvalidOperationException("error.family_not_empty");
		}

		familyRepository.delete(family);

		log.info("Deleted family {} ({})", family.getId(), family.getName());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family %s has been deleted.", family.getName()));
	}


	private FamilyView toView(Family family) {
		return toViews(List.of(family)).getFirst();
	}

	private List<FamilyView> toViews(List<Family> families) {
		Map<UUID, FamilyMemberView> members = memberViewsOf(families.stream().flatMap(family -> family.getPersons().stream()).toList());

		return families.stream()
				.map(family -> FamilyView.of(family, person -> members.get(person.getId())))
				.toList();
	}

	/**
	 * Builds each member's row, keyed by person.
	 */
	private Map<UUID, FamilyMemberView> memberViewsOf(List<Person> persons) {
		if (persons.isEmpty()) {
			return Map.of();
		}

		List<UUID> personIds = persons.stream().map(Person::getId).toList();
		YearMonth month = clock.currentYearMonth();

		Map<UUID, List<Membership>> monthByPerson = FamilyPositions.byPerson(
				membershipRepository.findActiveDuringForPersons(personIds, month.atDay(1), month.atEndOfMonth())
		);

		List<Person> billed = persons.stream()
				.filter(Person::isActive)
				.filter(person -> monthByPerson.containsKey(person.getId()))
				.toList();

		Map<UUID, Integer> positions = FamilyPositions.resolve(billed, monthByPerson);
		Map<UUID, Set<UUID>> groupIds = personService.activeGroupIdsOf(personIds);
		DiscountRules rules = discountService.currentRules();

		Map<UUID, FamilyMemberView> views = new HashMap<>();

		for (Person person : persons) {
			views.put(person.getId(), FamilyMemberView.of(
					person,
					groupIds.getOrDefault(person.getId(), Set.of()),
					positions.get(person.getId()),
					monthByPerson.getOrDefault(person.getId(), List.of()).size(),
					rules
			));
		}

		return views;
	}
}
