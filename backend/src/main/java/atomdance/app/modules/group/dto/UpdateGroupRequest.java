package atomdance.app.modules.group.dto;

import atomdance.app.modules.group.model.GroupBillingType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateGroupRequest(

		@Size(min = 1, max = 128, message = "Group name must be between 1 and 128 characters")
		String name,

		Boolean tournamentGroup,

		@DecimalMin(value = "0.00", message = "Cost for attending cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Cost for attending may have at most 2 decimal places")
		BigDecimal costForAttending,

		GroupBillingType billingType,

		Boolean active,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
