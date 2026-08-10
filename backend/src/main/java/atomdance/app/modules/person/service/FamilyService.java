package atomdance.app.modules.person.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.person.dto.CreateFamilyRequest;
import atomdance.app.modules.person.dto.FamilyView;
import atomdance.app.modules.person.dto.UpdateFamilyRequest;
import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.FamilyRepository;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FamilyService {

	private final FamilyRepository familyRepository;
	private final PersonRepository personRepository;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;


	public Family getOrThrow(UUID id) {
		return familyRepository.findByIdWithPersons(id)
				.orElseThrow(() -> new NotFoundException("entity.family"));
	}


	@Transactional(readOnly = true)
	public List<FamilyView> getAll() {
		auditLogger.record(securityService.getCurrentUserId(), AuditEventType.FAMILY_PREVIEW, AuditOutcome.SUCCESS, "Previewed all families.");
		return familyRepository.findAllWithPersons().stream().map(FamilyView::from).toList();
	}


	@Transactional(readOnly = true)
	public FamilyView get(UUID id) {
		auditLogger.record(securityService.getCurrentUserId(), id, AuditEventType.FAMILY_PREVIEW, AuditOutcome.SUCCESS, "Previewed family data.");
		return FamilyView.from(getOrThrow(id));
	}


	@Transactional
	public FamilyView create(CreateFamilyRequest request) {
		Family family = familyRepository.saveAndFlush(Family.builder()
				.name(request.name().trim())
				.phone(Person.normalizePhone(request.phone()))
				.email(Person.normalizeEmail(request.email()))
				.note(request.note())
				.build());

		if (request.memberIds() != null && !request.memberIds().isEmpty()) {
			attach(family, request.memberIds());
		}

		log.info("Created family {} ({})", family.getId(), family.getName());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family %s has been created.", family.getName()));

		return FamilyView.from(family);
	}


	@Transactional
	public FamilyView update(UUID id, UpdateFamilyRequest request) {
		Family family = getOrThrow(id);

		if (request.name() != null) {
			family.setName(request.name().trim());
		}

		if (request.phone() != null) {
			family.setPhone(Person.normalizePhone(request.phone()));
		}

		if (request.email() != null) {
			family.setEmail(Person.normalizeEmail(request.email()));
		}

		if (request.note() != null) {
			family.setNote(request.note());
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family %s has been updated.", family.getName()));

		return FamilyView.from(family);
	}


	@Transactional
	public FamilyView addMembers(UUID id, List<UUID> personIds) {
		Family family = getOrThrow(id);

		attach(family, personIds);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%d member(s) added to family %s.", personIds.size(), family.getName()));

		return FamilyView.from(family);
	}


	@Transactional
	public FamilyView removeMember(UUID id, UUID personId) {
		Family family = getOrThrow(id);
		Person person = personRepository.findByIdWithFamily(personId)
				.orElseThrow(() -> new NotFoundException("entity.person"));

		if (person.getFamily() == null || !person.getFamily().getId().equals(family.getId())) {
			throw new NotFoundException("entity.person");
		}

		person.setFamily(null);
		family.getPersons().removeIf(member -> member.getId().equals(personId));

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), family.getId(), AuditEventType.FAMILY_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s removed from family %s.", person.getFullName(), family.getName()));

		return FamilyView.from(family);
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

	/**
	 * Moving somebody into a family changes the discount order for everybody already in it, so any open ist needs recalculating afterwards - {@code PaymentListService.recalculate}.
	 */
	private void attach(Family family, List<UUID> personIds) {
		List<Person> persons = personRepository.findAllByIdWithFamily(personIds);

		if (persons.size() != personIds.size()) {
			throw new NotFoundException("entity.person");
		}

		for (Person person : persons) {
			person.setFamily(family);

			if (family.getPersons().stream().noneMatch(member -> member.getId().equals(person.getId()))) {
				family.getPersons().add(person);
			}
		}
	}
}
