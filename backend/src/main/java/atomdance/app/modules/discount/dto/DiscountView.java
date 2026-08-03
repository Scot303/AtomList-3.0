package atomdance.app.modules.discount.dto;

import atomdance.app.modules.discount.model.FamilySizeDiscount;
import atomdance.app.modules.discount.model.GroupCountDiscount;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * The whole discount configuration in one response.
 */
public record DiscountView(
		List<Entry> familySize,
		List<Entry> groupCount
) {

	/**
	 * @param threshold the position in family, or the number of groups attended.
	 */
	public record Entry(UUID id, int threshold, BigDecimal percent) {

		public static Entry from(FamilySizeDiscount discount) {
			return new Entry(discount.getId(), discount.getPosition(), discount.getPercent());
		}

		public static Entry from(GroupCountDiscount discount) {
			return new Entry(discount.getId(), discount.getGroupCount(), discount.getPercent());
		}
	}

	public static DiscountView of(List<FamilySizeDiscount> familySize, List<GroupCountDiscount> groupCount) {
		return new DiscountView(
				familySize.stream().map(Entry::from).toList(),
				groupCount.stream().map(Entry::from).toList()
		);
	}
}
