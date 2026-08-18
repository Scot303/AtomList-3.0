package atomdance.app.modules.finance.dto;

import java.util.List;
import java.util.UUID;


/**
 * Puts instructors onto a list as expense rows, with their hours left at zero.
 */
public record SeedInstructorExpensesRequest(
		List<UUID> instructorIds
) {}
