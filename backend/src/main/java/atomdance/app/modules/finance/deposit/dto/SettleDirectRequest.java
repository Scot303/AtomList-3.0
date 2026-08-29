package atomdance.app.modules.finance.deposit.dto;

import atomdance.app.modules.finance.deposit.model.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;


/**
 * Money handed over for one charge and nothing else.
 */
public record SettleDirectRequest(

		@NotNull(message = "Amount is required")
		@DecimalMin(value = "0.01", message = "Amount must be positive")
		@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
		BigDecimal amount,

		@NotNull(message = "Choose how the money was handed over")
		PaymentMethod paymentMethod,

		Instant receivedAt,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
