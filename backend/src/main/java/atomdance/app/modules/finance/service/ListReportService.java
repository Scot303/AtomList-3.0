package atomdance.app.modules.finance.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.dto.ListReportView;
import atomdance.app.modules.finance.dto.PaymentView;
import atomdance.app.modules.finance.model.Deposit;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.model.PaymentSettlement;
import atomdance.app.modules.finance.repository.DepositRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.finance.repository.PaymentSettlementRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.util.*;


/**
 * What one list says on paper.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ListReportService {

	private final PaymentListService paymentListService;
	private final PaymentRepository paymentRepository;
	private final PaymentSettlementRepository settlementRepository;
	private final DepositRepository depositRepository;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;
	private final MessageSource messageSource;


	@Transactional(readOnly = true)
	public ListReportView build(UUID listId) {
		PaymentList list = paymentListService.getOrThrow(listId);

		List<Payment> payments = paymentRepository.findByListIdWithSettlements(listId).stream()
				.sorted(PaymentView.DISPLAY_ORDER)
				.toList();

		List<Deposit> deposits = cashInFor(list, payments);
		Map<UUID, Integer> refs = referenceNumbers(deposits);

		List<ListReportView.Row> rows = payments.stream().map(payment -> row(payment, refs)).toList();
		List<ListReportView.Deposit> cashIn = deposits.stream().map(deposit -> deposit(deposit, list, refs)).toList();

		auditLogger.record(securityService.getCurrentUserId(), listId, AuditEventType.LIST_PREVIEW, AuditOutcome.SUCCESS, "List report generated.");

		return new ListReportView(
				list.getId(),
				list.getType(),
				list.getStatus(),
				list.isClosed(),
				list.getYear(),
				list.getMonth(),
				list.getName(),
				PaymentListService.describe(list),
				list.tracksContracts(),
				Instant.now(),
				rows,
				cashIn,
				totals(rows, cashIn)
		);
	}

	// ---------------------------------------------------------------- rows


	private ListReportView.Row row(Payment payment, Map<UUID, Integer> refs) {
		List<PaymentSettlement> settlements = payment.getSettlements().stream()
				.sorted(Comparator.comparing(PaymentSettlement::getSettledAt, Comparator.nullsLast(Comparator.naturalOrder()))
						.thenComparing(PaymentSettlement::getNumber, Comparator.nullsLast(Comparator.naturalOrder())))
				.toList();

		BigDecimal collectedHere = Money.ZERO;
		BigDecimal clearedElsewhere = Money.ZERO;
		List<ListReportView.Part> parts = new ArrayList<>(settlements.size());

		for (PaymentSettlement settlement : settlements) {
			if (settlement.isCarryingMoney()) {
				collectedHere = Money.add(collectedHere, settlement.getAmount());
			} else {
				clearedElsewhere = Money.add(clearedElsewhere, settlement.getAmount());
			}

			parts.add(part(settlement, refs));
		}

		return new ListReportView.Row(
				payment.getId(),
				payment.getCode(),
				payment.getPerson().getId(),
				payment.getPerson().getFullName(),
				payment.getPerson().getName(),
				payment.getPerson().getLastName(),
				payment.getPerson().getEffectivePhone(),
				payment.getChargeKind(),
				payment.getGroup() == null ? null : payment.getGroup().getId(),
				payment.getLabel(),
				payment.getUnitCost(),
				payment.getQuantity(),
				payment.getGross(),
				payment.getDiscountPercent(),
				payment.getDiscountAmount(),
				payment.getAmountToPay(),
				payment.getAmountSettled(),
				payment.getOutstanding(),
				collectedHere,
				clearedElsewhere,
				payment.isSettled(),
				payment.isContractReturned(),
				payment.getNote(),
				List.copyOf(parts)
		);
	}


	private ListReportView.Part part(PaymentSettlement settlement, Map<UUID, Integer> refs) {
		Deposit deposit = settlement.getDeposit();
		int ref = refs.getOrDefault(deposit.getId(), 0);

		return new ListReportView.Part(
				settlement.getId(),
				settlement.getCode(),
				settlement.getAmount(),
				deposit.getPaymentMethod(),
				settlement.getSettledAt(),
				deposit.getId(),
				deposit.getCode(),
				ref,
				settlement.isCarryingMoney(),
				deposit.getBookedYear(),
				deposit.getBookedMonth(),
				partLabel(settlement, ref)
		);
	}


	/**
	 * What to print against one instalment. Money that arrived for this period needs only its deposit named;
	 * money that came from another one has to say so, or the sheet looks short by that amount for no reason.
	 */
	private String partLabel(PaymentSettlement settlement, int ref) {
		Deposit deposit = settlement.getDeposit();

		if (settlement.isCarryingMoney()) {
			return message("report.from_deposit", new Object[]{ref}, "Z wpłaty #" + ref);
		}

		YearMonth booked = deposit.bookedFor();

		return message("report.cleared_from_deposit", new Object[]{ref, booked}, "Rozliczone z wpłaty #" + ref + " (" + booked + ")");
	}

	// ---------------------------------------------------------------- cash in


	/**
	 * The deposits a sheet has to account for: the money booked to its period, plus anything that settled a debt on it whenever that money arrived.
	 * <p>
	 * The first half is what makes the sheet reconcile against the cash box - money taken this month that went on an earlier month's debt
	 * is still money taken this month. The second half is what makes every paid row on the sheet traceable to a handover.
	 */
	private List<Deposit> cashInFor(PaymentList list, List<Payment> payments) {
		Map<UUID, Deposit> byId = new LinkedHashMap<>();
		YearMonth month = list.yearMonth();

		if (month != null) {
			for (Deposit deposit : depositRepository.findBookedFor(month.getYear(), month.getMonthValue())) {
				byId.putIfAbsent(deposit.getId(), deposit);
			}
		}

		for (Payment payment : payments) {
			for (PaymentSettlement settlement : payment.getSettlements()) {
				byId.putIfAbsent(settlement.getDeposit().getId(), settlement.getDeposit());
			}
		}

		return byId.values().stream()
				.sorted(Comparator.comparing(Deposit::getReceivedAt, Comparator.nullsLast(Comparator.naturalOrder()))
						.thenComparing(Deposit::getNumber, Comparator.nullsLast(Comparator.naturalOrder())))
				.toList();
	}


	/**
	 * "#1", "#2" - short handles in the order the deposits appear on the sheet, so a row can point at one without printing a full code.
	 */
	private static Map<UUID, Integer> referenceNumbers(List<Deposit> deposits) {
		Map<UUID, Integer> refs = new HashMap<>();
		int next = 1;

		for (Deposit deposit : deposits) {
			refs.put(deposit.getId(), next++);
		}

		return refs;
	}


	private ListReportView.Deposit deposit(Deposit deposit, PaymentList list, Map<UUID, Integer> refs) {
		List<PaymentSettlement> settlements = settlementRepository.findByDepositId(deposit.getId());

		BigDecimal countedHere = Money.ZERO;
		BigDecimal spentElsewhere = Money.ZERO;
		BigDecimal total = Money.ZERO;

		List<ListReportView.Allocation> allocations = new ArrayList<>(settlements.size());

		for (PaymentSettlement settlement : settlements) {
			Payment payment = settlement.getPayment();
			boolean onThisList = list.getId().equals(payment.getList().getId());

			if (onThisList && settlement.isCarryingMoney()) {
				countedHere = Money.add(countedHere, settlement.getAmount());
			} else {
				spentElsewhere = Money.add(spentElsewhere, settlement.getAmount());
			}

			total = Money.add(total, settlement.getAmount());
			allocations.add(allocation(settlement, list, onThisList));
		}

		int ref = refs.getOrDefault(deposit.getId(), 0);
		BigDecimal unallocated = Money.atLeastZero(Money.subtract(deposit.getTotalAmount(), total));

		return new ListReportView.Deposit(
				deposit.getId(),
				deposit.getCode(),
				ref,
				deposit.getPayer().getId(),
				deposit.getPayer().getFullName(),
				deposit.getPaymentMethod(),
				deposit.getReceivedAt(),
				deposit.getBookedYear(),
				deposit.getBookedMonth(),
				deposit.getOrigin().isDirect(),
				deposit.getTotalAmount(),
				countedHere,
				spentElsewhere,
				unallocated,
				Money.isPositive(spentElsewhere) || Money.isPositive(unallocated),
				deposit.getNote(),
				message("report.deposit", new Object[]{ref, deposit.getCode()}, "Deposit #" + ref + " (" + deposit.getCode() + ")"),
				Money.isPositive(unallocated) ? message("report.allocation.credit", new Object[0], "Credit not yet assigned") : null,
				List.copyOf(allocations)
		);
	}


	private ListReportView.Allocation allocation(PaymentSettlement settlement, PaymentList list, boolean onThisList) {
		Payment payment = settlement.getPayment();
		ListReportView.Direction direction = directionOf(payment.getList(), list, onThisList);

		return new ListReportView.Allocation(
				settlement.getId(),
				settlement.getAmount(),
				onThisList,
				settlement.isCarryingMoney(),
				direction,
				payment.getId(),
				payment.getCode(),
				payment.getPerson().getId(),
				payment.getPerson().getFullName(),
				payment.getLabel(),
				payment.getList().getId(),
				payment.getList().getYear(),
				payment.getList().getMonth(),
				payment.getList().isTournament(),
				PaymentListService.describe(payment.getList()),
				allocationLabel(direction, payment.getList())
		);
	}


	/**
	 * Where one part of a handover went, measured against the sheet being printed.
	 */
	private static ListReportView.Direction directionOf(PaymentList settled, PaymentList printed, boolean onThisList) {
		if (onThisList) {
			return ListReportView.Direction.THIS_LIST;
		}

		YearMonth settledMonth = settled.yearMonth();
		YearMonth printedMonth = printed.yearMonth();

		if (settledMonth == null || printedMonth == null) {
			return ListReportView.Direction.OTHER_LIST;
		}

		if (settledMonth.isBefore(printedMonth)) {
			return ListReportView.Direction.ARREARS;
		}

		if (settledMonth.isAfter(printedMonth)) {
			return ListReportView.Direction.ADVANCE;
		}

		return ListReportView.Direction.SAME_MONTH_OTHER_SHEET;
	}


	/**
	 * What to print against one part of a handover. Arrears and money paid ahead are named as such: this is the
	 * sheet the money arrived on, so it is the one that has to account for where the rest of it went.
	 */
	private String allocationLabel(ListReportView.Direction direction, PaymentList settled) {
		String where = PaymentListService.describe(settled);

		return switch (direction) {
			case THIS_LIST -> message("report.allocation.this_list", new Object[0], "This list");
			case ARREARS -> message("report.allocation.arrears", new Object[]{where}, "Arrears for " + where);
			case ADVANCE -> message("report.allocation.advance", new Object[]{where}, "Paid ahead for " + where);
			case SAME_MONTH_OTHER_SHEET -> message("report.allocation.other_sheet", new Object[]{where}, "Other sheet: " + where);
			case OTHER_LIST -> message("report.allocation.other_list", new Object[]{where}, "List " + where);
		};
	}

	// ---------------------------------------------------------------- totals


	private ListReportView.Totals totals(List<ListReportView.Row> rows, List<ListReportView.Deposit> cashIn) {
		BigDecimal billed = Money.ZERO;
		BigDecimal collected = Money.ZERO;
		BigDecimal cleared = Money.ZERO;
		BigDecimal outstanding = Money.ZERO;
		long settled = 0;

		for (ListReportView.Row row : rows) {
			billed = Money.add(billed, row.amountToPay());
			collected = Money.add(collected, row.collectedHere());
			cleared = Money.add(cleared, row.clearedElsewhere());
			outstanding = Money.add(outstanding, row.outstanding());

			if (row.settled()) {
				settled++;
			}
		}

		BigDecimal received = Money.ZERO;
		BigDecimal countedHere = Money.ZERO;
		BigDecimal spentElsewhere = Money.ZERO;
		BigDecimal unallocated = Money.ZERO;

		for (ListReportView.Deposit deposit : cashIn) {
			received = Money.add(received, deposit.totalAmount());
			countedHere = Money.add(countedHere, deposit.countedOnThisList());
			spentElsewhere = Money.add(spentElsewhere, deposit.spentElsewhere());
			unallocated = Money.add(unallocated, deposit.unallocated());
		}

		// The same money reached two different ways: summed over the rows, and summed over the deposits.
		// They have to agree, and if they ever do not the report is lying rather than the manager being wrong.
		boolean reconciles = collected.compareTo(countedHere) == 0
				&& received.compareTo(Money.add(countedHere, Money.add(spentElsewhere, unallocated))) == 0;

		if (!reconciles) {
			log.error("List report does not reconcile: rows collected {} against deposits counted {}; received {} against {} + {} + {}",
					collected, countedHere, received, countedHere, spentElsewhere, unallocated);
		}

		return new ListReportView.Totals(
				rows.size(),
				settled,
				billed,
				collected,
				cleared,
				outstanding,
				received,
				countedHere,
				spentElsewhere,
				unallocated,
				reconciles
		);
	}


	private String message(String key, Object[] args, String fallback) {
		return messageSource.getMessage(key, args, fallback, LocaleContextHolder.getLocale());
	}
}
