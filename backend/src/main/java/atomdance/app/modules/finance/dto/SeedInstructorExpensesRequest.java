package atomdance.app.modules.finance.dto;

import java.util.List;
import java.util.UUID;

/**
 * Puts instructors onto a list as expense rows, with their hours left at zero.
 *
 * @param instructorIds which instructors to add. Leave empty on a monthly list to add every active one;
 */
public record SeedInstructorExpensesRequest(
		List<UUID> instructorIds
) {}
