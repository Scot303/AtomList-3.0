package atomdance.app.modules.group.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.finance.service.PaymentListService;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipService {

	private final MembershipRepository membershipRepository;
	private final PaymentRepository paymentRepository;
	private final PaymentListService paymentListService;
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

		Membership membership = Membership.builder()
				.person(person)
				.group(group)
				.joinedAt(request.joinedAt() != null ? request.joinedAt() : clock.today())
				.customMonthlyCost(request.customMonthlyCost())
				.firstMonthCost(request.firstMonthCost())
				.note(request.note())
				.build();

		requireValidFirstMonthCost(membership);

		membershipRepository.saveAndFlush(membership);

		paymentListService.recalculateOpenStandardLists();

		log.info("Person {} was added to group {} on {}", personId, group.getId(), membership.getJoinedAt());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), personId, AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s was added to group %s on %s.%s",
				person.getFullName(), group.getName(), membership.getJoinedAt(), describeFirstMonth(membership, false)));

		return MembershipView.from(membership);
	}


	@Transactional
	public MembershipView update(UUID id, UpdateMembershipRequest request) {
		Membership membership = getOrThrow(id);

		BillingInputs before = BillingInputs.of(membership);

		if (request.joinedAt() != null) {
			if (membership.getLeftAt() != null && request.joinedAt().isAfter(membership.getLeftAt())) {
				throw new InvalidOperationException("error.left_before_joined");
			}

			membership.setJoinedAt(request.joinedAt());
		}

		// A membership moved onto the 1st of a month has no part-month left to price.
		boolean firstMonthOutgrown = !membership.joinedMidMonth() && membership.getFirstMonthCost() != null;

		if (firstMonthOutgrown) {
			membership.setFirstMonthCost(null);
		}

		if (Boolean.TRUE.equals(request.clearCustomMonthlyCost())) {
			membership.setCustomMonthlyCost(null);
		} else if (request.customMonthlyCost() != null) {
			membership.setCustomMonthlyCost(request.customMonthlyCost());
		}

		if (Boolean.TRUE.equals(request.clearFirstMonthCost())) {
			membership.setFirstMonthCost(null);
		} else if (request.firstMonthCost() != null) {
			membership.setFirstMonthCost(request.firstMonthCost());
		}

		requireValidFirstMonthCost(membership);

		if (request.note() != null) {
			membership.setNote(request.note());
		}

		if (BillingInputs.of(membership).differsFrom(before)) {
			paymentListService.recalculateOpenStandardLists();
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), membership.getPerson()
				.getId(), AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Membership of %s in group %s has been updated (cost %s).%s",
				membership.getPerson().getFullName(), membership.getGroup().getName(), membership.resolveUnitCost(), describeFirstMonth(membership, firstMonthOutgrown)));

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

		paymentListService.recalculateOpenStandardLists();

		log.info("Person {} left group {} on {}", membership.getPerson().getId(), membership.getGroup().getId(), effective);
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), membership.getPerson().getId(),
				AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("%s left group %s on %s.", membership.getPerson().getFullName(), membership.getGroup().getName(), effective)
		);

		return MembershipView.from(membership);
	}


	/**
	 * Everything about a membership that a monthly sheet reads.
	 */
	private record BillingInputs(LocalDate joinedAt, BigDecimal rate, BigDecimal firstMonthCost) {

		static BillingInputs of(Membership membership) {
			return new BillingInputs(membership.getJoinedAt(), membership.resolveUnitCost(), membership.getFirstMonthCost());
		}


		boolean differsFrom(BillingInputs other) {
			return !joinedAt.equals(other.joinedAt)
					|| !sameAmount(rate, other.rate)
					|| !sameAmount(firstMonthCost, other.firstMonthCost);
		}


		/**
		 * Compared by value, so a rate re-entered at another scale does not read as a change.
		 */
		private static boolean sameAmount(BigDecimal left, BigDecimal right) {
			if (left == null || right == null) {
				return left == right;
			}

			return left.compareTo(right) == 0;
		}
	}


	/**
	 * A part-month price only means something on a monthly group somebody joined part-way through, and only below what a whole month costs.
	 */
	private static void requireValidFirstMonthCost(Membership membership) {
		BigDecimal firstMonth = membership.getFirstMonthCost();

		if (firstMonth == null) {
			return;
		}

		if (membership.getGroup().isPerClass()) {
			throw new InvalidOperationException("error.first_month_cost_not_for_per_class");
		}

		if (!membership.joinedMidMonth()) {
			throw new InvalidOperationException("error.first_month_cost_requires_mid_month_join");
		}

		if (Money.isGreaterThan(firstMonth, membership.resolveUnitCost())) {
			throw new InvalidOperationException("error.first_month_cost_above_full_rate", membership.resolveUnitCost());
		}
	}


	/**
	 * The part-month clause of an audit line, empty when the joining month is billed like any other.
	 */
	private static String describeFirstMonth(Membership membership, boolean outgrown) {
		if (outgrown) {
			return " The joining month is billed in full again, as the membership no longer starts part-way through a month.";
		}

		if (membership.getFirstMonthCost() == null) {
			return "";
		}

		return String.format(" The joining month %s is billed at %s rather than the full %s.", membership.joinMonth(), membership.getFirstMonthCost(), membership.resolveUnitCost());
	}


	/**
	 * For a membership recorded by mistake. Ending it with {@link #leave} is almost always what is wanted instead, since a delete removes the reason a past list charged what it did.
	 */
	@Transactional
	public void delete(UUID id) {
		Membership membership = getOrThrow(id);

		int released = paymentRepository.releaseMembership(id);

		membershipRepository.delete(membership);

		// Drops what this membership was putting on any open sheet, unless somebody has already paid towards it.
		paymentListService.recalculateOpenStandardLists();

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), membership.getPerson().getId(),
				AuditEventType.MEMBERSHIP_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Membership of %s in group %s has been deleted, releasing %d charge(s) already raised from it.",
						membership.getPerson().getFullName(), membership.getGroup().getName(), released
				)
		);
	}

}
