package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * A charge added by hand for this month only - the monthly extras that are not covered by a membership.
 */
public record SaveOneTimeLineRequest(

		@NotBlank(message = "Description is required")
		@Size(max = 255, message = "Description is too long")
		String description,

		@NotNull(message = "Unit cost is required")
		@DecimalMin(value = "0.00", message = "Unit cost cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Unit cost may have at most 2 decimal places")
		BigDecimal unitCost,

		@DecimalMin(value = "0.00", message = "Quantity cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Quantity may have at most 2 decimal places")
		BigDecimal quantity
) {}
