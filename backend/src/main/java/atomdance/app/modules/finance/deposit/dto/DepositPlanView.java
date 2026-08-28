package atomdance.app.modules.finance.deposit.dto;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.deposit.service.DepositAllocationPlanner;

import java.math.BigDecimal;
import java.util.List;


/**
 * What a sum of money would settle, shown to a manager before anything is written.
 */
public record DepositPlanView(
		BigDecimal totalAmount,
		BigDecimal allocatedAmount,
		BigDecimal unallocatedAmount,
		boolean coversEverythingOwed,
		boolean nextMonthNotBilled,
		List<PlannedSettlementView> settlements
) {

	public static DepositPlanView from(DepositAllocationPlanner.Plan plan, BigDecimal total, boolean coversEverythingOwed, boolean nextMonthNotBilled) {
		return new DepositPlanView(
				Money.normalize(total),
				plan.allocated(),
				plan.unallocated(),
				coversEverythingOwed,
				nextMonthNotBilled,
				plan.settlements().stream().map(PlannedSettlementView::from).toList()
		);
	}
}
