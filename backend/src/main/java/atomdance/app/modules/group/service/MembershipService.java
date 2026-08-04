package atomdance.app.modules.group.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.group.dto.CreateMembershipRequest;
import atomdance.app.modules.group.dto.MembershipView;
import atomdance.app.modules.group.dto.UpdateMembershipRequest;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.model.Membership;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.service.PersonService;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipService {

	private final MembershipRepository membershipRepository;
	private final PersonService personService;
	private final GroupService groupService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final AppClock clock;

	public Membership getOrThrow(UUID id) {
		return membershipRepository.findByIdWithRelations(id)
				.orElseThrow(() -> new NotFoundException("entity.membership"));
	}

	@Transactional(readOnly = true)
	public List<MembershipView> getAllForPerson(UUID personId) {
		personService.getOrThrow(personId);

		return membershipRepository.findByPersonId(personId).stream().map(MembershipView::from).toList();
	}

	@Transactional
	public MembershipView create(UUID personId, CreateMembershipRequest request) {
		Person person = personService.getOrThrow(personId);
		Group group = groupService.getOrThrow(request.groupId());

		if (membershipRepository.existsActiveForPersonAndGroup(personId, group.getId())) {
			throw new InvalidOperationException("error.membership_already_active");
		}

		Membership membership = membershipRepository.saveAndFlush(Membership.builder()
				.person(person)
				.group(group)
				.joinedAt(request.joinedAt() != null ? request.joinedAt() : clock.today())
				.customMonthlyCost(request.customMonthlyCost())
				.note(request.note())
				.build());

		log.info("Person {} was added to group {} on {}", personId, group.getId(), membership.getJoinedAt());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), personId, AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s was added to group %s on %s.",
				person.getFullName(), group.getName(), membership.getJoinedAt()));

		return MembershipView.from(membership);
	}

	@Transactional
	public MembershipView update(UUID id, UpdateMembershipRequest request) {
		Membership membership = getOrThrow(id);

		if (request.joinedAt() != null) {
			if (membership.getLeftAt() != null && request.joinedAt().isAfter(membership.getLeftAt())) {
				throw new InvalidOperationException("error.left_before_joined");
			}

			membership.setJoinedAt(request.joinedAt());
		}

		if (Boolean.TRUE.equals(request.clearCustomMonthlyCost())) {
			membership.setCustomMonthlyCost(null);
		} else if (request.customMonthlyCost() != null) {
			membership.setCustomMonthlyCost(request.customMonthlyCost());
		}

		if (request.note() != null) {
			membership.setNote(request.note());
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), membership.getPerson()
				.getId(), AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Membership of %s in group %s has been updated (cost %s).",
				membership.getPerson().getFullName(), membership.getGroup().getName(), membership.resolveUnitCost()));

		return MembershipView.from(membership);
	}

	/**
	 * Ends a membership by dating it, keeping the row so past lists still explain themselves.
	 */
	@Transactional
	public MembershipView leave(UUID id, LocalDate leftAt) {
		Membership membership = getOrThrow(id);

		if (membership.getLeftAt() != null) {
			throw new InvalidOperationException("error.membership_already_ended");
		}

		LocalDate effective = leftAt != null ? leftAt : clock.today();

		if (effective.isBefore(membership.getJoinedAt())) {
			throw new InvalidOperationException("error.left_before_joined");
		}

		membership.setLeftAt(effective);

		log.info("Person {} left group {} on {}", membership.getPerson().getId(), membership.getGroup().getId(), effective);
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), membership.getPerson().getId(),
				AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("%s left group %s on %s.", membership.getPerson().getFullName(), membership.getGroup().getName(), effective)
		);

		return MembershipView.from(membership);
	}

	/**
	 * For a membership recorded by mistake. Ending it with {@link #leave} is almost always what is wanted instead, since a delete removes the reason a past list charged what it did.
	 */
	@Transactional
	public void delete(UUID id) {
		Membership membership = getOrThrow(id);

		membershipRepository.delete(membership);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), membership.getPerson().getId(),
				AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Membership of %s in group %s has been deleted.",
						membership.getPerson().getFullName(), membership.getGroup().getName()
				)
		);
	}

}
