package atomdance.app.modules.group.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateMembershipRequest(

		LocalDate joinedAt,

		@DecimalMin(value = "0.00", message = "Custom cost cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Custom cost may have at most 2 decimal places")
		BigDecimal customMonthlyCost,

		Boolean clearCustomMonthlyCost,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
