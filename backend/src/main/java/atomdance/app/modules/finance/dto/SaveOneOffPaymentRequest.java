package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;


/**
 * A charge added by hand for one list only, belonging to no group. No discount applies to it.
 */
public record SaveOneOffPaymentRequest(

		UUID personId,

		@NotBlank(message = "Description is required")
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
