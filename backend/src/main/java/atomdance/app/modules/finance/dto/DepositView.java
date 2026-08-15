package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.Deposit;
import atomdance.app.modules.finance.model.DepositOrigin;
import atomdance.app.modules.finance.model.PaymentMethod;
import atomdance.app.modules.finance.model.PaymentSettlement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.UUID;


/**
 * One handover of money, and what it went on.
 */
public record DepositView(
		UUID id,
		Long number,
		String code,
		UUID payerId,
		String payerName,
		String payerPhone,
		Set<UUID> coveredPersonIds,
		BigDecimal totalAmount,
		BigDecimal allocatedAmount,
		BigDecimal unallocatedAmount,
		PaymentMethod paymentMethod,
		Instant receivedAt,
		Integer bookedYear,
		Integer bookedMonth,
		Boolean forTournament,
		DepositOrigin origin,
		String note,
		Instant createdAt,
		List<DepositSettlementView> settlements
) {

	public DepositView {
		coveredPersonIds = coveredPersonIds == null ? Set.of() : Set.copyOf(coveredPersonIds);
	}


	private static final Comparator<PaymentSettlement> DISPLAY_ORDER = Comparator
			.comparing(PaymentSettlement::getSettledAt, Comparator.nullsLast(Comparator.naturalOrder()))
			.thenComparing(PaymentSettlement::getNumber, Comparator.nullsLast(Comparator.naturalOrder()));


	public static DepositView from(Deposit deposit) {
		return from(deposit, deposit.getSettlements());
	}


	/**
	 * For a read that loaded the settlements separately, with the payment and person each one names.
	 */
	public static DepositView from(Deposit deposit, List<PaymentSettlement> settlements) {
		return build(deposit, settlements.stream()
				.sorted(DISPLAY_ORDER)
				.map(DepositSettlementView::from)
				.toList());
	}


	public static DepositView withoutSettlements(Deposit deposit) {
		return build(deposit, null);
	}


	private static DepositView build(Deposit deposit, List<DepositSettlementView> settlements) {
		return new DepositView(
				deposit.getId(),
				deposit.getNumber(),
				deposit.getCode(),
				deposit.getPayer().getId(),
				deposit.getPayer().getFullName(),
				deposit.getPayer().getEffectivePhone(),
				deposit.getCoveredPersonIds(),
				deposit.getTotalAmount(),
				deposit.getAllocatedAmount(),
				deposit.getUnallocatedAmount(),
				deposit.getPaymentMethod(),
				deposit.getReceivedAt(),
				deposit.getBookedYear(),
				deposit.getBookedMonth(),
				deposit.getForTournament(),
				deposit.getOrigin(),
				deposit.getNote(),
				deposit.getCreatedAt(),
				settlements
		);
	}
}
