package atomdance.app.modules.discount.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.UUID;


/**
 * A hypothetical household to price up, as the reception calculator describes it.
 *
 * @param members everybody being quoted for, treated as one family
 */
public record PriceQuoteRequest(

		@NotEmpty(message = "At least one person is required")
		@Size(max = 5, message = "A household of more than 5 people cannot be quoted")
		List<@Valid Member> members
) {

	/**
	 * @param groups          the groups this person would join.
	 * @param studentDiscount whether they hold a student status, which adds the flat student rate.
	 */
	public record Member(

			@NotNull(message = "The group selection is required")
			@Size(max = 5, message = "More than 5 groups cannot be quoted for one person")
			List<@Valid Selection> groups,

			boolean studentDiscount
	) {}


	/**
	 * @param entries how many classes are expected, for a group billed per class. Ignored for a monthly group, which is always billed once. {@code null} means one.
	 */
	public record Selection(

			@NotNull(message = "Group is required")
			UUID groupId,

			@Min(value = 0, message = "The number of classes cannot be negative")
			@Max(value = 12, message = "The number of classes is unreasonably large")
			Integer entries
	) {

		public int entriesOrOne() {
			return entries == null ? 1 : entries;
		}
	}
}
