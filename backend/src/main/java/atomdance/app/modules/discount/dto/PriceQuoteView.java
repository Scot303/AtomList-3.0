package atomdance.app.modules.discount.dto;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.group.model.GroupType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


/**
 * What a hypothetical household would be billed, and why.
 * <p>
 * Reads back the whole calculation rather than only its result, so whoever is quoting can explain the figure:
 * both ladders, which rung of each answered for each person, the order the household was put in and the
 * amount that order was decided on, and the price of every group before and after the discount.
 *
 * @param members                in the order they were sent, so a caller can line each up with what it asked about
 * @param totals                 the whole household added up
 * @param familyLadder           every configured family-position rung, lowest position first
 * @param groupCountLadder       every configured group-count rung, lowest count first
 * @param studentDiscountPercent the flat student rate, so it can be named before anybody is marked as a student
 */
public record PriceQuoteView(
		List<Member> members,
		ScopeSplit totals,
		List<Rung> familyLadder,
		List<Rung> groupCountLadder,
		BigDecimal studentDiscountPercent
) {

	public record Rung(int threshold, BigDecimal percent) {}


	/**
	 * One person's quote.
	 *
	 * @param index               what position in the request this answers, counting from 0
	 * @param billed              whether anything at all is charged. False leaves every percentage at zero and takes up no rung in the household.
	 * @param familyPosition      where they sit in the household, counting from 1, or {@code null} when nothing is charged for them
	 * @param familyThreshold     the family rung that answered, or {@code null} when none is configured that low
	 * @param groupCount          how many groups counted towards the group-count ladder
	 * @param groupCountThreshold the group-count rung that answered, or {@code null} when none is configured that low
	 * @param monthlyBase         the recurring monthly charge the household order was decided on. Per-class groups are not in it.
	 * @param capped              whether the three parts summed past 100% and were trimmed
	 */
	public record Member(
			int index,
			boolean billed,
			Integer familyPosition,
			Integer familyThreshold,
			int groupCount,
			Integer groupCountThreshold,
			BigDecimal monthlyBase,
			boolean studentDiscount,
			BigDecimal familyPercent,
			BigDecimal groupCountPercent,
			BigDecimal studentPercent,
			BigDecimal totalPercent,
			boolean capped,
			List<Line> lines,
			ScopeSplit totals
	) {}


	/**
	 * One group on one person's quote.
	 *
	 * @param unitCost               the rate billed - a monthly fee, or the price of one class. The individually agreed amount when the request named one, the group's own otherwise.
	 * @param entries                how many of them are billed: always 1 for a monthly group
	 * @param countedTowardsDiscount false for a group priced at nothing, which is shown but counts towards neither ladder
	 */
	public record Line(
			UUID groupId,
			String groupName,
			GroupType type,
			boolean perClass,
			BigDecimal unitCost,
			int entries,
			BigDecimal gross,
			BigDecimal discountAmount,
			BigDecimal amountToPay,
			boolean countedTowardsDiscount
	) {

		public static Line of(UUID groupId, String groupName, GroupType type, boolean perClass, BigDecimal unitCost, int entries, BigDecimal gross, BigDecimal discountAmount, BigDecimal amountToPay, boolean counted) {
			return new Line(groupId, groupName, type, perClass, Money.normalize(unitCost), entries, gross, discountAmount, amountToPay, counted);
		}


		public MoneyScope asScope() {
			return new MoneyScope(gross, discountAmount, amountToPay);
		}
	}
}
