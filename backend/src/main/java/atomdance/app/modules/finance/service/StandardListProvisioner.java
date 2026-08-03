package atomdance.app.modules.finance.service;

import atomdance.app.modules.finance.model.ListStatus;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;

/**
 * Inserts the bare row for a month's list, in a transaction of its own.
 */
@Component
@RequiredArgsConstructor
public class StandardListProvisioner {

	private final PaymentListRepository paymentListRepository;

	/**
	 * @param type which of the month's two standard lists to insert
	 * @throws DataIntegrityViolationException if another caller created this month's list of that type first, which the caller is expected to handle by re-reading
	 */
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public PaymentList insert(YearMonth month, ListType type) {
		return paymentListRepository.saveAndFlush(PaymentList.builder()
				.type(type)
				.year(month.getYear())
				.month(month.getMonthValue())
				.status(ListStatus.OPEN)
				.build());
	}
}
