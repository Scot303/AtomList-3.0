package atomdance.app.modules.group.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateMembershipRequest(

		@NotNull(message = "Group is required")
		UUID groupId,

		LocalDate joinedAt,

		@DecimalMin(value = "0.00", message = "Custom cost cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Custom cost may have at most 2 decimal places")
		BigDecimal customMonthlyCost,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
