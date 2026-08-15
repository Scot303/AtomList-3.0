package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;


/**
 * How many classes somebody attended, for a per-class group - or the quantity on a one-off charge.
 */
public record UpdateQuantityRequest(

		@NotNull(message = "Quantity is required")
		@DecimalMin(value = "0.00", message = "Quantity cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Quantity has too many digits")
		BigDecimal quantity
) {}
