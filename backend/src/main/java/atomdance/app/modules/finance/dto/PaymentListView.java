package atomdance.app.modules.finance.dto;

import atomdance.app.modules.finance.model.ListPopulationMode;
import atomdance.app.modules.finance.model.ListStatus;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentList;

import java.time.Instant;
import java.util.UUID;

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
		ListPopulationMode populationMode,
		UUID sourceListId,
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
				list.getPopulationMode(),
				list.getSourceList() == null ? null : list.getSourceList().getId(),
				list.getNote(),
				list.getCreatedAt()
		);
	}
}
