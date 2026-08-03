package atomdance.app.modules.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Assigns an overpayment to the months it was meant to cover.
 */
public record AllocateOverpaymentRequest(

		@NotEmpty(message = "Choose at least one month to assign the overpayment to")
		@Valid
		List<Target> targets
) {

	/**
	 * @param year           the year to settle
	 * @param month          the month to settle
	 * @param tournamentList which of the month's two sheets to settle; absent means the regular one
	 * @param amount         how much of the overpayment to put against it; defaults to whatever is still owed there, capped by what remains of the overpayment
	 */
	public record Target(

			@NotNull(message = "Year is required")
			@Min(value = 2000, message = "Year is out of range")
			@Max(value = 2100, message = "Year is out of range")
			Integer year,

			@NotNull(message = "Month is required")
			@Min(value = 1, message = "Month must be between 1 and 12")
			@Max(value = 12, message = "Month must be between 1 and 12")
			Integer month,

			Boolean tournamentList,

			@DecimalMin(value = "0.00", message = "Amount cannot be negative")
			@Digits(integer = 10, fraction = 2, message = "Amount may have at most 2 decimal places")
			BigDecimal amount
	) {}
}
