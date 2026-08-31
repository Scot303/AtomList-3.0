package atomdance.app.modules.person.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.paymentList.service.PaymentListService;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.dto.CreatePersonRequest;
import atomdance.app.modules.person.dto.PersonView;
import atomdance.app.modules.person.dto.UpdatePersonRequest;
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
public class PersonService {

	private final PersonRepository personRepository;
	private final FamilyRepository familyRepository;
	private final MembershipRepository membershipRepository;
	private final PaymentListService paymentListService;
	private final AuditLogger auditLogger;
	private final AppClock clock;


	public Person getOrThrow(UUID id) {
		return personRepository.findByIdWithFamily(id)
				.orElseThrow(() -> new NotFoundException("entity.person"));
	}


	@Transactional(readOnly = true)
	public List<PersonView> getAll() {
		List<Person> persons = personRepository.findAllWithFamily();

		Map<UUID, Set<UUID>> groupIds = activeGroupIdsOf(persons.stream().map(Person::getId).toList());

		return persons.stream()
				.map(person -> PersonView.from(person, groupIds.getOrDefault(person.getId(), Set.of())))
				.toList();
	}


	@Transactional(readOnly = true)
	public PersonView get(UUID id) {
		Person person = getOrThrow(id);

		auditLogger.read(AuditEventType.PERSON_PREVIEW, id, "Previewed all data of %s.", person.getFullName());
		return toView(person);
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
				.joinedClubDate(request.joinedClubDate())
				.leftClubDate(request.leftClubDate())
				.isContractSigned(request.contractSigned() != null && request.contractSigned())
				.studentDiscount(request.studentDiscount() != null && request.studentDiscount())
				.family(request.familyId() == null ? null : getFamilyOrThrow(request.familyId()))
				.note(request.note())
				.isActive(true)
				.build();

		person = personRepository.saveAndFlush(person);

		auditLogger.success(AuditEventType.PERSON_MANAGEMENT, person.getId(), "Person %s has been created.", person.getFullName());

		return PersonView.from(person);
	}


	@Transactional
	public PersonView update(UUID id, UpdatePersonRequest request) {
		Person person = getOrThrow(id);
		boolean repricesOthers = false;

		if (request.name() != null) {
			person.setName(request.name().trim());
		}

		if (request.lastName() != null) {
			person.setLastName(request.lastName().trim());
		}

		if (request.phone() != null) {
			auditLogger.success(AuditEventType.PERSON_MANAGEMENT, person.getId(), "Changed phone number on %s from %s to %s.", person.getFullName(), person.getPhone(), request.phone());

			person.setPhone(Person.normalizePhone(request.phone()));
		}

		if (request.email() != null) {
			person.setEmail(Person.normalizeEmail(request.email()));
		}

		if (request.dateOfBirth() != null) {
			person.setDateOfBirth(request.dateOfBirth());
		}

		if (request.joinedStudioAt() != null && !request.joinedStudioAt().equals(person.getJoinedStudioAt())) {
			person.setJoinedStudioAt(request.joinedStudioAt());
			repricesOthers = true;
		}

		applyClubDates(person, request);

		if (request.contractSigned() != null) {
			person.setContractSigned(request.contractSigned());
		}

		// Changes what this person is charged, so any open sheet holding them is now out of date.
		if (request.studentDiscount() != null && request.studentDiscount() != person.isStudentDiscount()) {
			auditLogger.success(AuditEventType.PERSON_MANAGEMENT, person.getId(), "Changed studentDiscount on %s from %s to %s", person.getFullName(), person.isStudentDiscount(), request.studentDiscount());

			person.setStudentDiscount(request.studentDiscount());
			repricesOthers = true;
		}

		if (request.active() != null && request.active() != person.isActive()) {
			auditLogger.success(AuditEventType.PERSON_MANAGEMENT, person.getId(), "Changed isActive status on %s from %s to %s.", person.getFullName(), person.isActive(), request.active());

			person.setActive(request.active());
			repricesOthers = true;
		}

		repricesOthers |= applyFamilyChange(person, request);

		auditLogger.success(AuditEventType.PERSON_MANAGEMENT, person.getId(), "Person %s has been updated.", person.getFullName());

		if (request.note() != null) {
			person.setNote(request.note());
		}

		if (repricesOthers) {
			paymentListService.recalculateOpenStandardLists();
		}

		return toView(person);
	}


	private PersonView toView(Person person) {
		return PersonView.from(person, activeGroupIdsOf(List.of(person.getId())).getOrDefault(person.getId(), Set.of()));
	}


	/**
	 * The groups each of these people is currently attending, in one query.
	 */
	public Map<UUID, Set<UUID>> activeGroupIdsOf(Collection<UUID> personIds) {
		if (personIds.isEmpty()) {
			return Map.of();
		}

		return membershipRepository.findActiveGroupIdsForPersons(personIds).stream()
				.collect(Collectors.groupingBy(
						MembershipRepository.PersonGroupId::getPersonId,
						Collectors.mapping(MembershipRepository.PersonGroupId::getGroupId, Collectors.toCollection(LinkedHashSet::new))
				));
	}


	private static void applyClubDates(Person person, UpdatePersonRequest request) {
		if (Boolean.TRUE.equals(request.clearJoinedClubDate())) {
			person.setJoinedClubDate(null);
		} else if (request.joinedClubDate() != null) {
			person.setJoinedClubDate(request.joinedClubDate());
		}

		if (Boolean.TRUE.equals(request.clearLeftClubDate())) {
			person.setLeftClubDate(null);
		} else if (request.leftClubDate() != null) {
			person.setLeftClubDate(request.leftClubDate());
		}
	}


	/**
	 * @return whether the person actually changed household, rather than merely being sent the one they were already in.
	 */
	private boolean applyFamilyChange(Person person, UpdatePersonRequest request) {
		if (Boolean.TRUE.equals(request.clearFamily())) {
			if (person.getFamily() == null) {
				return false;
			}

			person.setFamily(null);

			return true;
		}

		if (request.familyId() == null || isAlreadyInFamily(person, request.familyId())) {
			return false;
		}

		auditLogger.success(AuditEventType.PERSON_MANAGEMENT, person.getId(), "Changed family on %s from %s to %s.", person.getFullName(), person.getFamily(), request.familyId());

		person.setFamily(getFamilyOrThrow(request.familyId()));

		return true;
	}


	private static boolean isAlreadyInFamily(Person person, UUID familyId) {
		return person.getFamily() != null && familyId.equals(person.getFamily().getId());
	}


	private Family getFamilyOrThrow(UUID familyId) {
		return familyRepository.findById(familyId)
				.orElseThrow(() -> new NotFoundException("entity.family"));
	}
}
