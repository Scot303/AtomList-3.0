package atomdance.app.common.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.*;


/**
 * The single source of truth for business logic.
 */
@Component
public class AppClock {

	private final ZoneId zone;


	public AppClock(@Value("${app.time-zone}") String zoneId) {
		this.zone = ZoneId.of(zoneId);
	}


	private ZonedDateTime now() {
		return ZonedDateTime.now(zone);
	}


	public OffsetDateTime nowOffset() {
		return now().toOffsetDateTime();
	}


	public LocalDate today() {
		return LocalDate.now(zone);
	}


	public YearMonth currentYearMonth() {
		return YearMonth.now(zone);
	}


	public YearMonth monthOf(Instant instant) {
		return instant == null ? null : YearMonth.from(instant.atZone(zone));
	}


	public Instant startOf(YearMonth month) {
		return month.atDay(1).atStartOfDay(zone).toInstant();
	}


	public Instant endOf(YearMonth month) {
		return startOf(month.plusMonths(1));
	}
}