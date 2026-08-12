package atomdance.app.modules.group.dto;

import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.model.GroupBillingType;

import java.math.BigDecimal;
import java.util.UUID;

public record GroupView(
		UUID id,
		String name,
		boolean tournamentGroup,
		BigDecimal costForAttending,
		GroupBillingType billingType,
		boolean active,
		String color,
		String note
) {

	public static GroupView from(Group group) {
		return new GroupView(
				group.getId(),
				group.getName(),
				group.isTournamentGroup(),
				group.getCostForAttending(),
				group.getBillingType(),
				group.isActive(),
				group.getColor(),
				group.getNote()
		);
	}
}
