package atomdance.app.modules.finance.paymentList.dto;

import atomdance.app.modules.finance.paymentList.model.ListPopulationMode;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


public record CreateCustomListRequest(

		@NotBlank(message = "List name is required")
		@Size(max = 255, message = "List name is too long")
		String name,

		Boolean campList,

		@NotNull(message = "Population mode is required")
		ListPopulationMode populationMode,

		/*
		 * BY_GROUPS: everybody currently attending any of these groups.
		 */
		List<UUID> groupIds,

		/*
		 * BY_PERSONS: exactly these people.
		 */
		List<UUID> personIds,

		@DecimalMin(value = "0.00", message = "Fixed price cannot be negative")
		@Digits(integer = 10, fraction = 2, message = "Fixed price may have at most 2 decimal places")
		BigDecimal fixedPrice,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
