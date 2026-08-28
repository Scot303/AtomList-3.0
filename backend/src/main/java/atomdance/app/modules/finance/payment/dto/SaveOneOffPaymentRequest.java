package atomdance.app.modules.finance.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;


/**
 * A charge added by hand for one list only. No discount applies to it.
 */
public record SaveOneOffPaymentRequest(

		UUID personId,

		UUID groupId,

		@Size(max = 255, message = "Description is too long")
		String description,

		@NotNull(message = "Amount is required")
		@DecimalMin(value = "0.00", message = "Amount cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
		BigDecimal unitCost,

		@DecimalMin(value = "0.00", message = "Quantity cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Quantity has too many digits")
		BigDecimal quantity
) {}
