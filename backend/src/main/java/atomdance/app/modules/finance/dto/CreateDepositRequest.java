package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.DepositScope;
import atomdance.app.modules.finance.model.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;


/**
 * Confirms what a plan proposed.
 *
 * @param personIds  everybody the money is for. The handover belongs to all of them.
 * @param scope      which account this money was paid into. Recorded on the deposit, so leftover credit spent weeks later is still confined to the charges that account pays for.
 * @param receivedAt when the cash arrived, which is also the month that reports it as income.
 * @param expected   what the manager was shown, echoed back. The plan is worked out again on the server and
 *                   compared against this, so a debt that changed in the meantime is rejected rather than settled behind their back.
 */
public record CreateDepositRequest(

		@NotNull(message = "Amount is required")
		@DecimalMin(value = "0.01", message = "Amount must be positive")
		@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
		BigDecimal amount,

		@NotNull(message = "Choose how the money was handed over")
		PaymentMethod paymentMethod,

		@NotEmpty(message = "At least one person is required")
		List<UUID> personIds,

		@NotNull(message = "Say which account this money was paid into")
		DepositScope scope,

		Instant receivedAt,

		Integer monthsAhead,

		@Valid
		List<ExpectedSettlement> expected,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
