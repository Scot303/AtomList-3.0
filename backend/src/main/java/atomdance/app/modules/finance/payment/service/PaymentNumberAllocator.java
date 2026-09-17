package atomdance.app.modules.finance.payment.service;

import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.UUID;


@Component
@RequiredArgsConstructor
public class PaymentNumberAllocator {

	private final PaymentRepository paymentRepository;


	/**
	 * Numbers every charge in {@code payments} that has none yet, continuing the list's own sequence.
	 * <p>
	 * Takes the whole batch at once so a list being populated costs one query rather than one per charge.
	 */
	public void number(UUID listId, Collection<Payment> payments) {
		if (payments.isEmpty()) {
			return;
		}

		long next = paymentRepository.highestNumberOnList(listId) + 1;

		for (Payment payment : payments) {
			if (payment.getNumber() == null) {
				payment.setNumber(next++);
			}
		}
	}
}
