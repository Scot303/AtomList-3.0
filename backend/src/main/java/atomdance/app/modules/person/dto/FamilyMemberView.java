package atomdance.app.modules.person.dto;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.discount.service.DiscountRules;
import atomdance.app.modules.person.model.Person;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * A household member as the family view shows them, together with the discount they currently attract.
 * <p>
 * The discount figures are a <em>preview of this month</em>, worked out on read from the memberships running now
 * and the ladder configured now. They are not a record of anything: what a person was actually charged is
 * snapshotted on their payment lines when the sheet is built, and editing the ladder afterwards does not move it.
 *
 * @param familyPosition  where they sit in the household's ladder, counting from 1, or null when nothing is being
 *                        charged for them this month - somebody inactive, or with no membership running. Such a
 *                        person takes up no slot, so they do not push their siblings further down.
 * @param groupCount      how many memberships ran this month, which is what {@code groupCountPercent} is read off.
 *                        Not always {@code groupIds.size()}: a membership that ended mid-month still counts here
 *                        but is no longer current.
 * @param discountPercent the two parts added together and capped, which is what the sheet would apply.
 */
public record FamilyMemberView(
		UUID id,
		String name,
		String lastName,
		String fullName,
		LocalDate dateOfBirth,
		String phone,
		String effectivePhone,
		boolean active,
		Set<UUID> groupIds,
		Integer familyPosition,
		int groupCount,
		BigDecimal familyPercent,
		BigDecimal groupCountPercent,
		BigDecimal discountPercent
) {

	public static FamilyMemberView of(Person person, Set<UUID> groupIds, Integer familyPosition, int groupCount, DiscountRules rules) {
		boolean billed = familyPosition != null;

		return new FamilyMemberView(
				person.getId(),
				person.getName(),
				person.getLastName(),
				person.getFullName(),
				person.getDateOfBirth(),
				person.getPhone(),
				person.getEffectivePhone(),
				person.isActive(),
				groupIds,
				familyPosition,
				groupCount,
				billed ? rules.familyPercent(familyPosition) : Money.ZERO,
				billed ? rules.groupCountPercent(groupCount) : Money.ZERO,
				billed ? rules.combinedPercent(familyPosition, groupCount) : Money.ZERO
		);
	}
}
