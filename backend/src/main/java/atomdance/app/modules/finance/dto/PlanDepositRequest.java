package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;


public record PlanDepositRequest(

		@NotNull(message = "Amount is required")
		@DecimalMin(value = "0.01", message = "Amount must be positive")
		@Digits(integer = 10, fraction = 2, message = "Amount has too many digits")
		BigDecimal amount,

		@NotEmpty(message = "At least one person is required")
		List<UUID> personIds,

		@NotNull(message = "Must specify whether this is for the tournament sheet or the regular one")
		Boolean tournament,

		Instant receivedAt,

		Integer bookedYear,

		Integer bookedMonth,

		Integer monthsAhead
) {}
