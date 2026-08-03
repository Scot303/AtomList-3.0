package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Sets how many classes somebody attended, for a per-class group.
 */
public record UpdateLineQuantityRequest(

		@NotNull(message = "Quantity is required")
		@DecimalMin(value = "0.00", message = "Quantity cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Quantity may have at most 2 decimal places")
		BigDecimal quantity
) {}
