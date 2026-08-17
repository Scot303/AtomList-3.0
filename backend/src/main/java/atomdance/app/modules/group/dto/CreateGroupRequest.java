package atomdance.app.modules.group.dto;

import atomdance.app.modules.group.model.GroupBillingType;
import atomdance.app.modules.group.model.GroupType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;


public record CreateGroupRequest(

		@NotBlank(message = "Group name is required")
		@Size(max = 128, message = "Group name is too long")
		String name,

		GroupType type,

		@NotNull(message = "Cost for attending is required")
		@DecimalMin(value = "0.00", message = "Cost for attending cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Cost for attending may have at most 2 decimal places")
		BigDecimal costForAttending,

		GroupBillingType billingType,

		Boolean active,

		@Pattern(regexp = "^[0-9A-Fa-f]{6}$", message = "Color must be six hex digits without a leading #")
		String color,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
