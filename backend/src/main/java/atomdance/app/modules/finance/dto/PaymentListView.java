package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.ListPopulationMode;
import atomdance.app.modules.finance.model.ListStatus;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentList;

import java.time.Instant;
import java.util.UUID;


/**
 * One list as the client reads it.
 */
public record PaymentListView(
		UUID id,
		ListType type,
		Integer month,
		Integer year,
		String name,
		ListStatus status,
		boolean closed,
		Instant closedAt,
		UUID closedByUserId,
		boolean isTournamentList,
		boolean tracksContracts,
		boolean requiresGroup,
		ListPopulationMode populationMode,
		String note,
		Instant createdAt
) {

	public static PaymentListView from(PaymentList list) {
		return new PaymentListView(
				list.getId(),
				list.getType(),
				list.getMonth(),
				list.getYear(),
				list.getName(),
				list.getStatus(),
				list.isClosed(),
				list.getClosedAt(),
				list.getClosedByUserId(),
				list.isTournament(),
				list.tracksContracts(),
				list.requiresGroup(),
				list.getPopulationMode(),
				list.getNote(),
				list.getCreatedAt()
		);
	}
}
