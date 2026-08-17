package atomdance.app.modules.group.dto;

import atomdance.app.modules.group.model.GroupBillingType;
import atomdance.app.modules.group.model.GroupType;
import atomdance.app.modules.group.model.Membership;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;


public record MembershipView(
		UUID id,
		UUID personId,
		String personName,
		UUID groupId,
		String groupName,
		GroupBillingType billingType,
		GroupType groupType,
		LocalDate joinedAt,
		LocalDate leftAt,
		boolean active,
		boolean joinedMidMonth,
		BigDecimal groupDefaultCost,
		BigDecimal customMonthlyCost,
		BigDecimal effectiveCost,
		BigDecimal firstMonthCost,
		String note
) {

	public static MembershipView from(Membership membership) {
		return new MembershipView(
				membership.getId(),
				membership.getPerson().getId(),
				membership.getPerson().getFullName(),
				membership.getGroup().getId(),
				membership.getGroup().getName(),
				membership.getGroup().getBillingType(),
				membership.getGroup().getType(),
				membership.getJoinedAt(),
				membership.getLeftAt(),
				membership.isActive(),
				membership.joinedMidMonth(),
				membership.getGroup().getCostForAttending(),
				membership.getCustomMonthlyCost(),
				membership.resolveUnitCost(),
				membership.getFirstMonthCost(),
				membership.getNote()
		);
	}
}
