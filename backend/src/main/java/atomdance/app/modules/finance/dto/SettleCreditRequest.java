package atomdance.app.modules.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


/**
 * Spends leftover credit on one list, settling what the manager was shown.
 */
public record SettleCreditRequest(

		@Valid
		List<Entry> expected
) {

	public record Entry(

			@NotNull(message = "Deposit is required")
			UUID depositId,

			@NotNull(message = "Payment is required")
			UUID paymentId,

			@NotNull(message = "Amount is required")
			@DecimalMin(value = "0.01", message = "Amount must be positive")
			@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
			BigDecimal amount
	) {}
}
