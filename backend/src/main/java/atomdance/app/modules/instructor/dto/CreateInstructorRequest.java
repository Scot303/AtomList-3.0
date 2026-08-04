package atomdance.app.modules.instructor.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateInstructorRequest(

		@NotBlank(message = "First name is required")
		@Size(max = 128, message = "First name is too long")
		String name,

		@NotBlank(message = "Last name is required")
		@Size(max = 128, message = "Last name is too long")
		String lastName,

		@NotNull(message = "Cost per hour is required")
		@DecimalMin(value = "0.00", message = "Cost per hour cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Cost per hour may have at most 2 decimal places")
		BigDecimal costPerHour,

		LocalDate contractSignedDate,

		@Size(max = 64, message = "Contract number is too long")
		String contractNumber,

		Boolean active,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
