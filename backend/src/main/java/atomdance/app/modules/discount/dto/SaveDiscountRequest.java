package atomdance.app.modules.discount.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record SaveDiscountRequest(

		@NotNull(message = "Threshold is required")
		@Min(value = 1, message = "Threshold must be at least 1")
		@Max(value = 10, message = "Threshold is unreasonably large")
		Integer threshold,

		@NotNull(message = "Percent is required")
		@DecimalMin(value = "0.00", message = "Percent cannot be negative")
		@DecimalMax(value = "100.00", message = "Percent cannot exceed 100")
		@Digits(integer = 3, fraction = 2, message = "Percent may have at most 2 decimal places")
		BigDecimal percent
) {}
