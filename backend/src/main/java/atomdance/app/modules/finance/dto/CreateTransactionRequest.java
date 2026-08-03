package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.TransactionType;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateTransactionRequest(

		@NotBlank(message = "Name is required")
		@Size(max = 1024, message = "Name is too long")
		String name,

		@NotNull(message = "Type is required")
		TransactionType type,

		@NotNull(message = "Amount is required")
		@DecimalMin(value = "0.00", message = "Amount cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Amount may have at most 2 decimal places")
		BigDecimal amount,

		/*
		 * Defaults to 1.
		 */
		@DecimalMin(value = "0.00", message = "Quantity cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Quantity may have at most 2 decimal places")
		BigDecimal quantity,

		@Size(max = 64, message = "Invoice number is too long")
		String invoiceNumber,

		UUID instructorId,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
