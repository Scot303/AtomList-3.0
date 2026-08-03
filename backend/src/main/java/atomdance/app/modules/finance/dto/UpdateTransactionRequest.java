package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateTransactionRequest(

		@Size(min = 1, max = 1024, message = "Name must be between 1 and 1024 characters")
		String name,

		@DecimalMin(value = "0.00", message = "Amount cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Amount may have at most 2 decimal places")
		BigDecimal amount,

		/*
		 * On an instructor row, the hours they worked that month.
		 */
		@DecimalMin(value = "0.00", message = "Quantity cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Quantity may have at most 2 decimal places")
		BigDecimal quantity,

		@Size(max = 64, message = "Invoice number is too long")
		String invoiceNumber,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
