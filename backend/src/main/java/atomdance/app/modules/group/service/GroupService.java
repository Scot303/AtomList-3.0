package atomdance.app.modules.group.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NameTakenException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.SearchPatterns;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.group.dto.CreateGroupRequest;
import atomdance.app.modules.group.dto.GroupView;
import atomdance.app.modules.group.dto.UpdateGroupRequest;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.model.GroupBillingType;
import atomdance.app.modules.group.repository.GroupRepository;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

	private final GroupRepository groupRepository;
	private final MembershipRepository membershipRepository;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;

	public Group getOrThrow(UUID id) {
		return groupRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("entity.group"));
	}

	@Transactional(readOnly = true)
	public Page<GroupView> getAll(String search, boolean activeOnly, Pageable pageable) {
		return groupRepository.search(SearchPatterns.contains(search), activeOnly, pageable).map(GroupView::from);
	}

	@Transactional(readOnly = true)
	public GroupView get(UUID id) {
		return GroupView.from(getOrThrow(id));
	}

	@Transactional
	public GroupView create(CreateGroupRequest request) {
		String name = request.name().trim();

		if (groupRepository.existsByNameIgnoreCase(name)) {
			throw new NameTakenException("entity.group");
		}

		Group group = groupRepository.saveAndFlush(Group.builder()
				.name(name)
				.isTournamentGroup(request.tournamentGroup() != null && request.tournamentGroup())
				.costForAttending(request.costForAttending())
				.billingType(request.billingType() != null ? request.billingType() : GroupBillingType.MONTHLY)
				.isActive(request.active() == null || request.active())
				.color(request.color())
				.note(request.note())
				.build());

		log.info("Created group {} ({}) billed {}", group.getId(), group.getName(), group.getBillingType());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), group.getId(), AuditEventType.GROUP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Group %s has been created with cost %s (%s).",
				group.getName(), group.getCostForAttending(), group.getBillingType()));

		return GroupView.from(group);
	}

	@Transactional
	public GroupView update(UUID id, UpdateGroupRequest request) {
		Group group = getOrThrow(id);

		if (request.name() != null) {
			String name = request.name().trim();

			if (groupRepository.countByNameExcluding(name, id) > 0) {
				throw new NameTakenException("entity.group");
			}

			group.setName(name);
		}

		if (request.costForAttending() != null && group.getCostForAttending().compareTo(request.costForAttending()) != 0) {
			log.info("Changed cost on group {} from {} to {}", group.getId(), group.getCostForAttending(), request.costForAttending());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), group.getId(), AuditEventType.GROUP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Group %s cost changed from %s to %s.",
					group.getName(), group.getCostForAttending(), request.costForAttending()));

			group.setCostForAttending(request.costForAttending());
		}

		if (request.billingType() != null && request.billingType() != group.getBillingType()) {
			log.info("Changed billing type on group {} from {} to {}", group.getId(), group.getBillingType(), request.billingType());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), group.getId(), AuditEventType.GROUP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Group %s billing type changed from %s to %s.",
					group.getName(), group.getBillingType(), request.billingType()));

			group.setBillingType(request.billingType());
		}

		if (request.tournamentGroup() != null) {
			group.setTournamentGroup(request.tournamentGroup());
		}

		if (request.active() != null) {
			log.info("Changed group {} from {} to {}", group.getId(), group.isActive(), request.active());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), group.getId(), AuditEventType.GROUP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Group %s changed status from %s to %s.",
					group.getName(), group.isActive(), request.active()));

			group.setActive(request.active());
		}

		if (request.color() != null) {
			group.setColor(request.color());
		}

		if (request.note() != null) {
			group.setNote(request.note());
		}

		return GroupView.from(group);
	}

	/**
	 * Refused once anybody has ever attended, because the memberships are what past lists were built from. Deactivate instead.
	 */
	@Transactional
	public void delete(UUID id) {
		Group group = getOrThrow(id);

		if (membershipRepository.countByGroupId(id) > 0) {
			throw new InvalidOperationException("error.group_in_use");
		}

		groupRepository.delete(group);

		log.info("Deleted group {} ({})", group.getId(), group.getName());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), group.getId(), AuditEventType.GROUP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Group %s has been deleted.", group.getName()));
	}
}
