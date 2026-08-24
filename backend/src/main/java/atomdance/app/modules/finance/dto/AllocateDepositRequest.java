package atomdance.app.modules.finance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


/**
 * Spends what is left of a deposit.
 * <p>
 * With no {@code targets}, the credit is spent the way a fresh plan says - arrears first.
 *
 * @param personIds who to plan against, defaulting to the people the deposit was recorded for
 * @param expected  what the manager was shown, echoed back.
 */
public record AllocateDepositRequest(

		List<UUID> personIds,

		Integer monthsAhead,

		@Valid
		List<Target> targets,

		@Valid
		List<ExpectedSettlement> expected
) {

	public record Target(

			@NotNull(message = "Payment is required")
			UUID paymentId,

			@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
			BigDecimal amount
	) {}
}
