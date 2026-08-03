package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.ListPopulationMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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

		/*
		 * FROM_UNPAID: everybody still owing on this list, carrying their outstanding amount over.
		 */
		UUID sourceListId,

		@Size(max = 512, message = "Note is too long")
		String note
) {}
