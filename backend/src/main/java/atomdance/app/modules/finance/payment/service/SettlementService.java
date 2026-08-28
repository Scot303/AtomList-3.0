package atomdance.app.modules.finance.payment.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.utils.AppClock;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.deposit.model.Deposit;
import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.model.PaymentSettlement;
import atomdance.app.modules.finance.payment.repository.PaymentSettlementRepository;
import atomdance.app.modules.finance.paymentList.model.PaymentList;
import atomdance.app.modules.finance.paymentList.service.PaymentListService;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;


/**
 * The only writer of settlements, and so the only place that decides whether a payment's money is reported where the debt was, or where the cash was.
 * <p>
 * Three rules hold the books together here. Each of them guards a way of producing figures that look plausible and are wrong:
 * <ol>
 *     <li>A payment can never be settled beyond what it charges. Surplus stays on the deposit as credit, so no row ever holds money that belongs to a different debt.</li>
 *     <li>A deposit can never fund more than it holds, so the same złoty cannot be spent twice.</li>
 *     <li>Money that arrived in a month other than the list's own - or landing on a list already sent to the accountants - is a <em>clearance</em>:
 *         it settles the debt and is counted as income in its own month instead. Recorded once, at write time, and never recomputed.</li>
 * </ol>
 * Writing a settlement is deliberately the one thing allowed to reach a {@code CLOSED} list.
 * It arrives as a clearance, contributing nothing to that list's money, so what the accountants were sent cannot move.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SettlementService {

	private final PaymentSettlementRepository settlementRepository;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final AppClock clock;


	/**
	 * Puts some of a deposit's money against one debt.
	 *
	 * @param requested how much to put against it, or {@code null} for as much of it as the deposit can cover
	 */
	@Transactional
	public void settle(Deposit deposit, Payment payment, BigDecimal requested, Instant settledAt) {
		BigDecimal owed = payment.getOutstanding();
		BigDecimal available = deposit.getUnallocatedAmount();

		if (!deposit.maySettleOn(payment.getList())) {
			throw new InvalidOperationException("error.deposit_wrong_sheet");
		}

		if (!Money.isPositive(owed)) {
			throw new InvalidOperationException("error.payment_already_settled");
		}

		if (!Money.isPositive(available)) {
			throw new InvalidOperationException("error.deposit_fully_allocated");
		}

		BigDecimal amount = Money.min(requested != null ? Money.normalize(requested) : owed, Money.min(owed, available));

		if (!Money.isPositive(amount)) {
			throw new InvalidOperationException("error.settlement_amount_required");
		}

		YearMonth cashMonth = clock.monthOf(deposit.getReceivedAt());

		PaymentSettlement settlement = PaymentSettlement.builder()
				.amount(amount)
				.isCarryingMoney(booksToOwnList(cashMonth, payment.getList()))
				.settledAt(settledAt != null ? settledAt : Instant.now())
				.createdByUserId(securityService.getCurrentUserId())
				.build();

		deposit.addSettlement(settlement);
		payment.addSettlement(settlement);

		settlementRepository.save(settlement);

		log.info("Settled {} of payment {} [{}] out of deposit {}{}",
				amount, payment.getCode(), payment.getId(), deposit.getCode(),
				settlement.isClearance() ? " as a clearance - the cash is reported in " + cashMonth : "");

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("%s of deposit %s settled %s for %s on list %s%s.",
						amount, deposit.getCode(), payment.getLabel(), payment.getPerson().getFullName(), PaymentListService.describeList(payment.getList()),
						settlement.isClearance() ? String.format(", as a clearance - the money is reported in %s", cashMonth) : ""));
	}


	/**
	 * Takes a settlement back off a payment, returning its amount to the deposit's credit.
	 */
	@Transactional
	public void remove(PaymentSettlement settlement) {
		Payment payment = settlement.getPayment();
		Deposit deposit = settlement.getDeposit();

		// Undoing a clearance only makes a month owing again. Undoing real money on a closed list would change a figure that has already been sent out.
		if (settlement.isCarryingMoney() && payment.getList().isClosed()) {
			throw new InvalidOperationException("error.settlement_on_closed_list");
		}

		BigDecimal amount = settlement.getAmount();

		payment.removeSettlement(settlement);
		deposit.removeSettlement(settlement);

		log.info("Removed a settlement of {} from payment {} [{}]; the money is credit on deposit {} again", amount, payment.getCode(), payment.getId(), deposit.getCode());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), payment.getId(), AuditEventType.PAYMENT_MANAGEMENT, AuditOutcome.SUCCESS,
				String.format("%s taken back off %s for %s on list %s; it is credit on deposit %s again.",
						amount, payment.getLabel(), payment.getPerson().getFullName(), PaymentListService.describeList(payment.getList()), deposit.getCode()));
	}


	/**
	 * Whether cash that arrived in {@code cashMonth} counts as income on the given list, rather than only clearing a debt there.
	 *
	 * @param cashMonth the month the money arrived in, read in the studio's zone
	 */
	private static boolean booksToOwnList(YearMonth cashMonth, PaymentList list) {
		if (list.isClosed()) {
			return false;
		}

		YearMonth month = list.yearMonth();

		// An ad-hoc sheet bills no month, so there is no other month for its money to belong to.
		return month == null || month.equals(cashMonth);
	}
}
