package atomdance.app.modules.finance.payment.service;

import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.model.PaymentChargeKind;
import atomdance.app.modules.finance.payment.repository.PaymentRepository;
import atomdance.app.modules.person.model.Person;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;


class PaymentNumberAllocatorTest {

	private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
	private final PaymentNumberAllocator allocator = new PaymentNumberAllocator(paymentRepository);


	@Test
	void numbersNewPaymentsInDisplayOrderRegardlessOfInputOrder() {
		UUID listId = UUID.randomUUID();
		Payment zoe = payment("Zoe", "Nowak", "Jazz");
		Payment antony = payment("Antony", "Kowalski", "Tango");
		Payment anna = payment("Anna", "Kowalski", "Ballet");

		when(paymentRepository.highestNumberOnList(listId)).thenReturn(7L);

		allocator.number(listId, List.of(zoe, antony, anna));

		assertThat(anna.getNumber()).isEqualTo(8L);
		assertThat(antony.getNumber()).isEqualTo(9L);
		assertThat(zoe.getNumber()).isEqualTo(10L);
	}


	@Test
	void leavesExistingNumbersUntouchedAndContinuesAfterTheLastOne() {
		UUID listId = UUID.randomUUID();
		Payment existing = payment("Anna", "Kowalski", "Ballet");
		existing.setNumber(2L);
		Payment newPayment = payment("Zoe", "Nowak", "Jazz");

		when(paymentRepository.highestNumberOnList(listId)).thenReturn(7L);

		allocator.number(listId, List.of(newPayment, existing));

		assertThat(existing.getNumber()).isEqualTo(2L);
		assertThat(newPayment.getNumber()).isEqualTo(8L);
	}


	private static Payment payment(String name, String lastName, String label) {
		return Payment.builder()
				.person(Person.builder().name(name).lastName(lastName).build())
				.chargeKind(PaymentChargeKind.ONE_TIME)
				.description(label)
				.build();
	}
}
