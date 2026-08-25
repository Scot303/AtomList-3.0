package atomdance.app.modules.finance.service;

import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.finance.model.ListType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.YearMonth;


/**
 * Brings the current month's lists into being on the first of the month.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonthlyListScheduler {

	private final PaymentListService paymentListService;
	private final AppClock clock;

	@Value("${app.lists.auto-create:true}")
	private boolean autoCreate;


	@Scheduled(cron = "0 10 2 1 * *", zone = "UTC")
	public void createCurrentMonthList() {
		if (!autoCreate) {
			return;
		}

		YearMonth month = clock.currentYearMonth();

		// One try per sheet, so a failure on one still leaves the other created.
		for (ListType type : ListType.standardTypes()) {
			try {
				paymentListService.ensureStandardList(month, type);
			} catch (RuntimeException e) {
				log.error("Could not create the {} list for {}", type, month, e);
			}
		}
	}
}
