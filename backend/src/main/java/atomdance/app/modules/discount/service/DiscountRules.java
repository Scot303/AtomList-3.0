package atomdance.app.modules.discount.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.discount.model.FamilySizeDiscount;
import atomdance.app.modules.discount.model.GroupCountDiscount;

import java.math.BigDecimal;
import java.util.*;

/**
 * An immutable snapshot of the discount configuration, read once per calculation.
 */
public final class DiscountRules {

	private static final BigDecimal MAX_PERCENT = BigDecimal.valueOf(100);

	private final NavigableMap<Integer, BigDecimal> byFamilyPosition;
	private final NavigableMap<Integer, BigDecimal> byGroupCount;

	private DiscountRules(NavigableMap<Integer, BigDecimal> byFamilyPosition, NavigableMap<Integer, BigDecimal> byGroupCount) {
		this.byFamilyPosition = byFamilyPosition;
		this.byGroupCount = byGroupCount;
	}

	public static DiscountRules of(Collection<FamilySizeDiscount> familyDiscounts, Collection<GroupCountDiscount> groupCountDiscounts) {
		NavigableMap<Integer, BigDecimal> family = new TreeMap<>();
		NavigableMap<Integer, BigDecimal> groups = new TreeMap<>();

		for (FamilySizeDiscount discount : familyDiscounts) {
			family.put(discount.getPosition(), Money.normalize(discount.getPercent()));
		}

		for (GroupCountDiscount discount : groupCountDiscounts) {
			groups.put(discount.getGroupCount(), Money.normalize(discount.getPercent()));
		}

		return new DiscountRules(family, groups);
	}

	/**
	 * For tests and for the empty-configuration case.
	 */
	public static DiscountRules none() {
		return new DiscountRules(new TreeMap<>(), new TreeMap<>());
	}

	public static DiscountRules fromMaps(Map<Integer, BigDecimal> byFamilyPosition, Map<Integer, BigDecimal> byGroupCount) {
		return new DiscountRules(new TreeMap<>(byFamilyPosition), new TreeMap<>(byGroupCount));
	}

	/**
	 * @param position which person in the family this is, counting from 1.
	 */
	public BigDecimal familyPercent(int position) {
		return floorPercent(byFamilyPosition, position);
	}

	public BigDecimal groupCountPercent(int groupCount) {
		return floorPercent(byGroupCount, groupCount);
	}

	/**
	 * The two discounts add up rather than compounding.
	 * Capped at 100%, so a future misconfiguration cannot produce a negative charge.
	 */
	public BigDecimal combinedPercent(int familyPosition, int groupCount) {
		BigDecimal total = familyPercent(familyPosition).add(groupCountPercent(groupCount));

		return Money.min(total, MAX_PERCENT);
	}

	/**
	 * The configured family-position rungs, lowest position first.
	 */
	public NavigableMap<Integer, BigDecimal> familyLadder() {
		return Collections.unmodifiableNavigableMap(byFamilyPosition);
	}

	/**
	 * The configured group-count rungs, lowest count first.
	 */
	public NavigableMap<Integer, BigDecimal> groupCountLadder() {
		return Collections.unmodifiableNavigableMap(byGroupCount);
	}

	public Integer familyThreshold(int position) {
		return floorThreshold(byFamilyPosition, position);
	}

	public Integer groupCountThreshold(int groupCount) {
		return floorThreshold(byGroupCount, groupCount);
	}

	/**
	 * Looks up the highest configured threshold at or below the given value, so a value past the end of
	 * the ladder keeps the deepest configured discount instead of falling back to none.
	 */
	private static BigDecimal floorPercent(NavigableMap<Integer, BigDecimal> rules, int value) {
		Map.Entry<Integer, BigDecimal> entry = rules.floorEntry(value);

		return entry == null ? Money.ZERO : entry.getValue();
	}

	/**
	 * The key {@link #floorPercent} would have matched.
	 */
	private static Integer floorThreshold(NavigableMap<Integer, BigDecimal> rules, int value) {
		return rules.floorKey(value);
	}
}
