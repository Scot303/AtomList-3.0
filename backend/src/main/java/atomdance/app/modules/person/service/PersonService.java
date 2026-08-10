package atomdance.app.modules.person.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.dto.CreatePersonRequest;
import atomdance.app.modules.person.dto.PersonView;
import atomdance.app.modules.person.dto.UpdatePersonRequest;
import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.FamilyRepository;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PersonService {

	private final PersonRepository personRepository;
	private final FamilyRepository familyRepository;
	private final MembershipRepository membershipRepository;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final AppClock clock;

	public Person getOrThrow(UUID id) {
		return personRepository.findByIdWithFamily(id)
				.orElseThrow(() -> new NotFoundException("entity.person"));
	}

	@Transactional(readOnly = true)
	public List<PersonView> getAll() {
		auditLogger.record(securityService.getCurrentUserId(), AuditEventType.PERSON_PREVIEW, AuditOutcome.SUCCESS, "Previewed all persons.");

		List<Person> persons = personRepository.findAllWithFamily();

		Map<UUID, Set<UUID>> groupIds = activeGroupIdsOf(persons.stream().map(Person::getId).toList());

		return persons.stream()
				.map(person -> PersonView.from(person, groupIds.getOrDefault(person.getId(), Set.of())))
				.toList();
	}

	@Transactional(readOnly = true)
	public PersonView get(UUID id) {
		auditLogger.record(securityService.getCurrentUserId(), id, AuditEventType.PERSON_PREVIEW, AuditOutcome.SUCCESS, "Previewed all data of a person.");
		return toView(getOrThrow(id));
	}

	@Transactional
	public PersonView create(CreatePersonRequest request) {
		Person person = Person.builder()
				.name(request.name().trim())
				.lastName(request.lastName().trim())
				.phone(Person.normalizePhone(request.phone()))
				.email(Person.normalizeEmail(request.email()))
				.dateOfBirth(request.dateOfBirth())
				.joinedStudioAt(request.joinedStudioAt() != null ? request.joinedStudioAt() : clock.today())
				.isActive(request.active() == null || request.active())
				.isContractSigned(request.contractSigned() != null && request.contractSigned())
				.family(request.familyId() == null ? null : familyOrThrow(request.familyId()))
				.note(request.note())
				.build();

		person = personRepository.saveAndFlush(person);

		log.info("Created person {} ({})", person.getId(), person.getFullName());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), person.getId(), AuditEventType.PERSON_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("Person %s has been created.", person.getFullName())
		);

		// Nobody has had a chance to join a group yet, so there is nothing to look up.
		return PersonView.from(person);
	}

	@Transactional
	public PersonView update(UUID id, UpdatePersonRequest request) {
		Person person = getOrThrow(id);

		if (request.name() != null) {
			person.setName(request.name().trim());
		}

		if (request.lastName() != null) {
			person.setLastName(request.lastName().trim());
		}

		if (request.phone() != null) {
			person.setPhone(Person.normalizePhone(request.phone()));
		}

		if (request.email() != null) {
			person.setEmail(Person.normalizeEmail(request.email()));
		}

		if (request.dateOfBirth() != null) {
			person.setDateOfBirth(request.dateOfBirth());
		}

		if (request.joinedStudioAt() != null) {
			person.setJoinedStudioAt(request.joinedStudioAt());
		}

		if (request.contractSigned() != null) {
			person.setContractSigned(request.contractSigned());
		}

		if (request.active() != null && request.active() != person.isActive()) {
			log.info("Changed isActive status on person {} from {} to {}", person.getId(), person.isActive(), request.active());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), person.getId(), AuditEventType.PERSON_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Status of %s has been changed.", person.getFullName()));

			person.setActive(request.active());
		}

		applyFamilyChange(person, request);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), person.getId(), AuditEventType.PERSON_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Person %s has been updated.", person.getFullName()));

		if (request.note() != null) {
			person.setNote(request.note());
		}

		return toView(person);
	}

	@Transactional
	public void delete(UUID id) {
		Person person = getOrThrow(id);

		personRepository.delete(person);

		log.info("Deleted person {} ({})", person.getId(), person.getFullName());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), person.getId(), AuditEventType.PERSON_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Person %s has been deleted.", person.getFullName()));
	}


	private PersonView toView(Person person) {
		return PersonView.from(person, activeGroupIdsOf(List.of(person.getId())).getOrDefault(person.getId(), Set.of()));
	}

	/**
	 * The groups each of these people is currently attending, in one query.
	 * <p>
	 * A {@link LinkedHashSet} rather than any set: the query orders by group name, and that order is
	 * what the client draws the badges in.
	 */
	private Map<UUID, Set<UUID>> activeGroupIdsOf(Collection<UUID> personIds) {
		if (personIds.isEmpty()) {
			return Map.of();
		}

		return membershipRepository.findActiveGroupIdsForPersons(personIds).stream()
				.collect(Collectors.groupingBy(
						MembershipRepository.PersonGroupId::getPersonId,
						Collectors.mapping(MembershipRepository.PersonGroupId::getGroupId, Collectors.toCollection(LinkedHashSet::new))
				));
	}

	private void applyFamilyChange(Person person, UpdatePersonRequest request) {
		if (Boolean.TRUE.equals(request.clearFamily())) {
			person.setFamily(null);

			return;
		}

		if (request.familyId() != null) {
			person.setFamily(familyOrThrow(request.familyId()));
		}
	}

	private Family familyOrThrow(UUID familyId) {
		return familyRepository.findById(familyId)
				.orElseThrow(() -> new NotFoundException("entity.family"));
	}
}
