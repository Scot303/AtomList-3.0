package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.DepositScope;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;


/**
 * @param scope      which account the money was paid into, which decides the charges it may reach
 * @param receivedAt when the cash arrived. The month it falls in is the one "arrears" and "ahead" are measured against; omitted, the current month is used.
 */
public record PlanDepositRequest(

		@NotNull(message = "Amount is required")
		@DecimalMin(value = "0.01", message = "Amount must be positive")
		@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
		BigDecimal amount,

		@NotEmpty(message = "At least one person is required")
		List<UUID> personIds,

		@NotNull(message = "Must specify which account this money was paid into")
		DepositScope scope,

		Instant receivedAt,

		Integer monthsAhead
) {}
