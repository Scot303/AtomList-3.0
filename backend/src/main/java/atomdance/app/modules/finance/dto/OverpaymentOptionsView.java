package atomdance.app.modules.finance.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * What a manager is shown when a payment carries more money than the month it was paid on needed.
 *
 * @param overpayment           everything paid beyond what this month asked for
 * @param alreadyAllocated      how much of it has already been handed to other months
 * @param available             what is left to assign
 * @param lookingAtFutureMonths whether the candidates are future months, which only happens when there is no unpaid past month left to settle
 * @param candidates            the months to choose from, oldest first
 * @param existingAllocations   months this overpayment has already settled, so an assignment can be undone
 */
public record OverpaymentOptionsView(
		BigDecimal overpayment,
		BigDecimal alreadyAllocated,
		BigDecimal available,
		boolean lookingAtFutureMonths,
		List<OverpaymentCandidateView> candidates,
		List<OverpaymentCandidateView> existingAllocations
) {}
