package atomdance.app.modules.finance.payment.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.payment.dto.PaymentView;
import atomdance.app.modules.finance.payment.dto.SaveOneOffPaymentRequest;
import atomdance.app.modules.finance.payment.dto.UpdatePaymentRequest;
import atomdance.app.modules.finance.payment.dto.UpdateQuantityRequest;
import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.model.PaymentChargeKind;
import atomdance.app.modules.finance.payment.model.PaymentCode;
import atomdance.app.modules.finance.payment.repository.PaymentRepository;
import atomdance.app.modules.finance.paymentList.model.PaymentList;
import atomdance.app.modules.finance.paymentList.service.PaymentListService;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.service.GroupService;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


/**
 * The charge side of a payment: what somebody owes for one group, and why.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

	private final PaymentRepository paymentRepository;
	private final PaymentListService paymentListService;
	private final GroupService groupService;
	private final PersonRepository personRepository;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;


	public Payment getOrThrow(UUID id) {
		return paymentRepository.findByIdWithSettlements(id)
				.orElseThrow(() -> new NotFoundException("entity.payment"));
	}


	@Transactional(readOnly = true)
	public List<PaymentView> getForList(UUID listId) {
		paymentListService.getOrThrow(listId);

		return paymentRepository.findByListIdWithSettlements(listId).stream()
				.sorted(PaymentView.DISPLAY_ORDER)
				.map(PaymentView::withoutSettlements)
				.toList();
	}


	@Transactional(readOnly = true)
	public PaymentView get(UUID id) {
		return PaymentView.from(getOrThrow(id));
	}


	@Transactional(readOnly = true)
	public PaymentView getByCode(String code) {
		Long number = PaymentCode.parse(code)
				.orElseThrow(() -> new NotFoundException("entity.payment"));

		return PaymentView.from(paymentRepository.findByNumberWithSettlements(number)
				.orElseThrow(() -> new NotFoundException("entity.payment")));
	}


	@Transactional
	public PaymentView update(UUID id, UpdatePaymentRequest request) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		if (request.contractReturned() != null) {
			if (!payment.getList().tracksContracts()) {
				throw new InvalidOperationException("error.contract_tracking_not_applicable");
			}

			payment.setContractReturned(request.contractReturned());
		}

		if (request.note() != null) {
			payment.setNote(request.note());
		}

		return PaymentView.from(payment);
	}


	/**
	 * Adds a charge for this list only, which no membership backs and no recalculation rewrites.
	 */
	@Transactional
	public PaymentView addOneOff(UUID listId, SaveOneOffPaymentRequest request) {
		PaymentList list = paymentListService.getOrThrow(listId);
		list.assertOpen();

		Person person = personRepository.findById(request.personId())
				.orElseThrow(() -> new NotFoundException("entity.person"));

		Payment payment = Payment.builder()
				.list(list)
				.person(person)
				.chargeKind(PaymentChargeKind.ONE_TIME)
				.unitCost(Money.normalize(request.unitCost()))
				.quantity(request.quantity() != null ? Money.normalize(request.quantity()) : BigDecimal.ONE)
				.build();

		pointAtCharge(payment, list, request);

		payment.applyDiscount(Money.ZERO);
		paymentRepository.save(payment);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("One-off charge '%s' of %s added for %s on list %s.",
				payment.getLabel(), payment.getAmountToPay(), person.getFullName(), PaymentListService.describeList(list)));

		return PaymentView.from(payment);
	}


	/**
	 * Sets how many classes somebody attended, for a per-class group - or the quantity on a one-off charge.
	 */
	@Transactional
	public PaymentView updateQuantity(UUID id, UpdateQuantityRequest request) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		if (payment.getChargeKind() == PaymentChargeKind.MEMBERSHIP_MONTHLY) {
			throw new InvalidOperationException("error.monthly_quantity_fixed");
		}

		payment.setQuantity(Money.normalize(request.quantity()));
		payment.applyDiscount(payment.getDiscountPercent());

		guardAgainstUnderfundedCharge(payment);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Quantity on '%s' for %s set to %s, giving %s on payment %s.",
				payment.getLabel(), payment.getPerson().getFullName(), payment.getQuantity(), payment.getAmountToPay(), payment.getCode()));

		return PaymentView.from(payment);
	}


	/**
	 * Edits a hand-added charge. A membership-derived one is not editable here: its rate comes from the group
	 * or the individually agreed amount, and a recalculation would overwrite anything typed over it.
	 */
	@Transactional
	public PaymentView updateOneOff(UUID id, SaveOneOffPaymentRequest request) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		requireOneOff(payment);

		pointAtCharge(payment, payment.getList(), request);

		payment.setUnitCost(Money.normalize(request.unitCost()));
		payment.setQuantity(request.quantity() != null ? Money.normalize(request.quantity()) : BigDecimal.ONE);
		payment.applyDiscount(Money.ZERO);

		guardAgainstUnderfundedCharge(payment);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("One-off charge %s for %s changed to '%s' of %s.",
				payment.getCode(), payment.getPerson().getFullName(), payment.getLabel(), payment.getAmountToPay()));

		return PaymentView.from(payment);
	}


	/**
	 * Points a hand-added charge at whatever its list bills.
	 */
	private void pointAtCharge(Payment payment, PaymentList list, SaveOneOffPaymentRequest request) {
		if (list.requiresGroup()) {
			if (request.groupId() == null) {
				throw new InvalidOperationException("error.charge_requires_group");
			}

			Group group = groupService.getOrThrow(request.groupId());
			PaymentListService.requireSameAccount(list, group);

			payment.setGroup(group);
			payment.setDescription(group.getName());

			return;
		}

		if (request.groupId() != null) {
			throw new InvalidOperationException("error.charge_takes_no_group");
		}

		if (request.description() == null || request.description().isBlank()) {
			throw new InvalidOperationException("error.charge_requires_description");
		}

		payment.setDescription(request.description().trim());
	}


	@Transactional
	public void deleteOneOff(UUID id) {
		Payment payment = getOrThrow(id);
		payment.getList().assertOpen();

		requireOneOff(payment);

		if (payment.holdsSettlements()) {
			throw new InvalidOperationException("error.payment_holds_money");
		}

		paymentRepository.delete(payment);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), id, AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("One-off charge '%s' removed for %s on list %s.",
				payment.getLabel(), payment.getPerson().getFullName(), PaymentListService.describeList(payment.getList())));
	}


	private static void requireOneOff(Payment payment) {
		if (payment.getChargeKind().isMembershipDerived()) {
			throw new InvalidOperationException("error.cannot_edit_membership_charge");
		}
	}


	/**
	 * Refuses to drop a charge below what has already been paid towards it, which would leave money settled against a debt that no longer exists.
	 */
	private static void guardAgainstUnderfundedCharge(Payment payment) {
		if (Money.isGreaterThan(payment.getAmountSettled(), payment.getAmountToPay())) {
			throw new InvalidOperationException("error.charge_below_settled", payment.getAmountSettled());
		}
	}
}
