package atomdance.app.modules.finance.payment.service;

import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.model.PaymentOrder;
import atomdance.app.modules.finance.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.UUID;


@Component
@RequiredArgsConstructor
public class PaymentNumberAllocator {

	private final PaymentRepository paymentRepository;


	/**
	 * Numbers every charge in {@code payments} that has none yet, continuing the list's own sequence in display order.
	 * <p>
	 * Takes the whole batch at once so a list being populated costs one query rather than one per charge.
	 */
	public void number(UUID listId, Collection<Payment> payments) {
		if (payments.isEmpty()) {
			return;
		}

		long next = paymentRepository.highestNumberOnList(listId) + 1;

		List<Payment> sortedPayments = payments.stream()
				.filter(payment -> payment.getNumber() == null)
				.sorted(PaymentOrder.DISPLAY_ORDER)
				.toList();

		for (Payment payment : sortedPayments) {
			payment.setNumber(next++);
		}
	}
}
