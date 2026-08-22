package atomdance.app.modules.finance.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentList;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.*;


/**
 * Works out what a sum of money will settle, and in what order.
 * <p>
 * Arrears first, oldest month first, then the month in hand, then a month paid ahead.
 */
@Component
public class DepositAllocationPlanner {

	/**
	 * @param partial whether this payment is left still owing something afterwards
	 */
	public record PlannedSettlement(Payment payment, BigDecimal amount, boolean partial) {
	}


	/**
	 * @param settlements what the money covers, in the order it is spent
	 * @param allocated   how much of the total is spent
	 * @param unallocated what is left over, which becomes credit held for everybody the handover covered
	 */
	public record Plan(List<PlannedSettlement> settlements, BigDecimal allocated, BigDecimal unallocated) {

		public boolean isEmpty() {
			return settlements.isEmpty();
		}
	}


	/**
	 * @param outstanding every debt these people still carry on a monthly list
	 * @param personOrder the people as the manager picked them, which decides who is paid off first within a month
	 * @param reference   the month "past" and "ahead" are measured against
	 * @param total       what was handed over
	 * @param monthsAhead how far ahead somebody may pay once no arrears are left
	 */
	public Plan plan(List<Payment> outstanding, List<UUID> personOrder, YearMonth reference, BigDecimal total, int monthsAhead) {
		YearMonth furthest = reference.plusMonths(monthsAhead);
		BigDecimal remaining = Money.normalize(total);

		List<PlannedSettlement> planned = new ArrayList<>();

		for (Payment payment : inSpendingOrder(outstanding, personOrder)) {
			if (!Money.isPositive(remaining)) {
				break;
			}

			if (isTooFarAhead(payment.getList(), furthest)) {
				continue;
			}

			BigDecimal owed = payment.getOutstanding();

			if (!Money.isPositive(owed)) {
				continue;
			}

			BigDecimal amount = Money.min(owed, remaining);

			planned.add(new PlannedSettlement(payment, amount, Money.isGreaterThan(owed, amount)));

			remaining = Money.subtract(remaining, amount);
		}

		return new Plan(List.copyOf(planned), Money.subtract(total, remaining), Money.atLeastZero(remaining));
	}


	/**
	 * Somebody may clear what they owe and pay a little ahead, but not fund a year in advance by accident.
	 */
	private static boolean isTooFarAhead(PaymentList list, YearMonth furthest) {
		YearMonth month = list.yearMonth();

		return month != null && month.isAfter(furthest);
	}


	/**
	 * Oldest month first, and within a month the people in the order they were picked - so the person a manager
	 * named first is the one whose groups come off the total first.
	 */
	private static List<Payment> inSpendingOrder(List<Payment> payments, List<UUID> personOrder) {
		Map<UUID, Integer> rank = new HashMap<>();

		for (int index = 0; index < personOrder.size(); index++) {
			rank.putIfAbsent(personOrder.get(index), index);
		}

		return payments.stream()
				.sorted(Comparator
						.comparing((Payment payment) -> payment.getList().yearMonth(), Comparator.nullsLast(Comparator.naturalOrder()))
						.thenComparingInt(payment -> rank.getOrDefault(payment.getPerson().getId(), Integer.MAX_VALUE))
						.thenComparing(payment -> payment.getPerson().getLastName(), String.CASE_INSENSITIVE_ORDER)
						.thenComparing(payment -> payment.getPerson().getName(), String.CASE_INSENSITIVE_ORDER)
						.thenComparing(Payment::getLabel, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
						.thenComparing(Payment::getNumber, Comparator.nullsLast(Comparator.naturalOrder())))
				.toList();
	}
}
