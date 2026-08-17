package atomdance.app.modules.finance.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;


/**
 * People to put on an existing open list, each with one charge to fill in afterwards.
 */
public record AddPersonsRequest(

		@NotEmpty(message = "At least one person is required")
		List<UUID> personIds,

		UUID groupId
) {}
