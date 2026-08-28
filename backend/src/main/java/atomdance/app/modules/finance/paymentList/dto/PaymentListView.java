package atomdance.app.modules.finance.paymentList.dto;

import atomdance.app.modules.finance.paymentList.model.ListPopulationMode;
import atomdance.app.modules.finance.paymentList.model.ListStatus;
import atomdance.app.modules.finance.paymentList.model.ListType;
import atomdance.app.modules.finance.paymentList.model.PaymentList;

import java.math.BigDecimal;
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
		BigDecimal fixedPrice,
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
				list.getFixedPrice(),
				list.getNote(),
				list.getCreatedAt()
		);
	}
}
