package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;


/**
 * One line of the plan the manager approved, echoed back when they confirm it.
 * <p>
 * The plan is worked out again on the server and compared against these, so a debt that changed in the meantime is
 * reported instead of quietly changing what the money covers.
 */
public record ExpectedSettlement(

		@NotNull(message = "Payment is required")
		UUID paymentId,

		@NotNull(message = "Amount is required")
		@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
		BigDecimal amount
) {}
