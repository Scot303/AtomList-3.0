package atomdance.app.modules.person.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;


/**
 * One person's discount for the current month, together with everything it was worked out from.
 * <p>
 * This is a <em>preview</em>, computed on read from the memberships running now and the ladders configured now.
 * It is not a record of anything: what somebody was actually charged is snapshotted onto their payment lines when the sheet is built,
 * and editing a ladder afterwards does not move it. A closed month can therefore disagree with this quite legitimately.
 *
 * @param billed       whether anything is being charged for this person this month. False leaves both parts at zero: somebody inactive, with no membership
 *                     running, or with nothing but free ones, takes up no slot in their household's ladder and so does not push their siblings down either.
 * @param household    the household ladder this person sits in, or null when they have no family - in which case they are positioned as the first person.
 * @param memberships  every membership running this month, counted towards {@code groupCountDiscount.input} or not - a group that charges nothing is shown but does not count.
 * @param totalPercent the two parts added together and capped, which is what a sheet built now would apply.
 * @param capped       whether the cap actually bit, meaning the parts summed past 100%.
 */
public record PersonDiscountView(
		UUID personId,
		String personName,
		int year,
		int month,
		boolean active,
		boolean billed,
		Household household,
		List<CountedMembership> memberships,
		Component familyDiscount,
		Component groupCountDiscount,
		BigDecimal totalPercent,
		boolean capped
) {

	/**
	 * One of the two parts of the total, with the ladder it was read off.
	 *
	 * @param input            what the ladder was looked up by - the family position, or the number of groups.
	 * @param matchedThreshold the rung that answered, or null when nothing is configured at or below {@code input}.
	 * @param ladder           every configured rung, so the matched one can be shown in context.
	 */
	public record Component(
			Integer input,
			Integer matchedThreshold,
			BigDecimal percent,
			List<Rung> ladder
	) {
	}


	/**
	 * One configured step of a ladder.
	 *
	 * @param applied whether this is the rung the percentage was read off.
	 */
	public record Rung(int threshold, BigDecimal percent, boolean applied) {
	}


	/**
	 * @param members the household in ladder order, everybody who takes up no slot last.
	 */
	public record Household(UUID familyId, String familyName, List<Sibling> members) {
	}


	/**
	 * One member of the household as the ladder sees them.
	 *
	 * @param position    where they sit, counting from 1, or null when nothing is being charged for them this month.
	 * @param monthlyBase the recurring charge the order was decided on, or null when they hold no position.
	 * @param self        whether this is the person the preview was asked for.
	 */
	public record Sibling(
			UUID personId,
			String fullName,
			Integer position,
			BigDecimal monthlyBase,
			boolean self
	) {
	}


	/**
	 * One membership the group-count discount was worked out from.
	 *
	 * @param monthlyCost the agreed rate, or null for a per-class group, which has no monthly figure.
	 * @param current     false for a membership that ended mid-month: it still counts here, because the month was charged for it, but it is no longer running.
	 * @param counted     whether it counted towards the group count. False for a group this person pays nothing for this month, which is shown for the explanation but adds nothing to the total.
	 */
	public record CountedMembership(
			UUID membershipId,
			UUID groupId,
			String groupName,
			boolean perClass,
			BigDecimal monthlyCost,
			boolean current,
			boolean counted
	) {
	}
}
