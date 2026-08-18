package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;


public record UpdateCustomListRequest(

		@Size(min = 1, max = 255, message = "List name must be between 1 and 255 characters")
		String name,

		@DecimalMin(value = "0.00", message = "Fixed price cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Fixed price may have at most 2 decimal places")
		BigDecimal fixedPrice,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
