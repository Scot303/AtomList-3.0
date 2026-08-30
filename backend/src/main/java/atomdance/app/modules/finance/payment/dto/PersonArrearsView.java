package atomdance.app.modules.finance.payment.dto;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.person.model.Person;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;


/**
 * Everything one person still owes, across every sheet they appear on, oldest month first.
 *
 * @param totalBilled      what the unfinished charges came to
 * @param totalSettled     what has already been paid towards them
 * @param totalOutstanding what is still missing, which is the figure being asked for
 */
public record PersonArrearsView(
		UUID personId,
		String personName,
		BigDecimal totalBilled,
		BigDecimal totalSettled,
		BigDecimal totalOutstanding,
		List<OutstandingPaymentView> payments
) {

	public static PersonArrearsView of(Person person, List<Payment> outstanding) {
		List<OutstandingPaymentView> payments = outstanding.stream()
				.map(OutstandingPaymentView::from)
				.toList();

		return new PersonArrearsView(
				person.getId(),
				person.getFullName(),
				sum(payments, OutstandingPaymentView::amountToPay),
				sum(payments, OutstandingPaymentView::amountSettled),
				sum(payments, OutstandingPaymentView::outstanding),
				payments
		);
	}


	private static BigDecimal sum(List<OutstandingPaymentView> payments, Function<OutstandingPaymentView, BigDecimal> field) {
		return payments.stream()
				.map(field)
				.reduce(Money.ZERO, Money::add);
	}
}
