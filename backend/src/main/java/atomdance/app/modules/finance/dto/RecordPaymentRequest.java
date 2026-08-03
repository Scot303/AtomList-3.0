package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Records what somebody handed over.
 * {@code amountPaid} may exceed what is owed. The excess stays here as an overpayment until a manager assigns it to the months it was meant for.
 */
public record RecordPaymentRequest(

		@NotNull(message = "Amount paid is required")
		@DecimalMin(value = "0.00", message = "Amount paid cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Amount paid may have at most 2 decimal places")
		BigDecimal amountPaid,

		/*
		 * Required unless the amount is zero, which is how a payment recorded by mistake is undone.
		 */
		PaymentMethod paymentMethod,

		Instant paidAt
) {}
