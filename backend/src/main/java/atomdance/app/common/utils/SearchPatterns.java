package atomdance.app.common.utils;

/**
 * Turns a user-typed search box into a pattern the repository queries can use.
 */
public final class SearchPatterns {

	private SearchPatterns() {
	}

	public static String contains(String search) {
		if (search == null || search.isBlank()) {
			return null;
		}

		return "%" + search.trim().toLowerCase() + "%";
	}
}
