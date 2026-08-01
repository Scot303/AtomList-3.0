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

	public ZoneId zone() {
		return zone;
	}

	public ZonedDateTime now() {
		return ZonedDateTime.now(zone);
	}

	public OffsetDateTime nowOffset() {
		return now().toOffsetDateTime();
	}

	/**
	 * The current calendar day in the application zone.
	 */
	public LocalDate today() {
		return LocalDate.now(zone);
	}

	/**
	 * The current wall-clock time in the application zone.
	 */
	public LocalTime timeNow() {
		return LocalTime.now(zone);
	}

	/**
	 * The current wall-clock date and time in the application zone.
	 */
	public LocalDateTime nowLocal() {
		return LocalDateTime.now(zone);
	}

	/**
	 * The current year and month in the application zone.
	 */
	public YearMonth currentYearMonth() {
		return YearMonth.now(zone);
	}

	/**
	 * Re-anchors an instant onto the application zone, keeping the moment and replacing the offset.
	 */
	public ZonedDateTime at(OffsetDateTime moment) {
		return moment.atZoneSameInstant(zone);
	}
}