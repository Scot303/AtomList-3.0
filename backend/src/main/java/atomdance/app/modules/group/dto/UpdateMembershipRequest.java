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

		/**
		 * What to bill for the month they joined. Only accepted while {@code joinedAt} falls part-way through a month.
		 */
		@DecimalMin(value = "0.00", message = "First-month cost cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "First-month cost may have at most 2 decimal places")
		BigDecimal firstMonthCost,

		/**
		 * Puts the joining month back on the standing rate.
		 */
		Boolean clearFirstMonthCost,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
