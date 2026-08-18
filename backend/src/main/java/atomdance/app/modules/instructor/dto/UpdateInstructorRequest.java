package atomdance.app.modules.instructor.dto;

import atomdance.app.modules.instructor.model.ContractType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;


public record UpdateInstructorRequest(

		@Size(min = 1, max = 128, message = "First name must be between 1 and 128 characters")
		String name,

		@Size(min = 1, max = 128, message = "Last name must be between 1 and 128 characters")
		String lastName,

		@DecimalMin(value = "0.00", message = "Cost per hour cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Cost per hour may have at most 2 decimal places")
		BigDecimal costPerHour,

		LocalDate contractSignedDate,

		@Size(max = 64, message = "Contract number is too long")
		String contractNumber,

		ContractType contractType,

		Boolean active,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
