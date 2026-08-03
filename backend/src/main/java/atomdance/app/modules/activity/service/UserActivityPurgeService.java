package atomdance.app.modules.activity.service;

import atomdance.app.modules.activity.model.ActivityStatus;
import atomdance.app.modules.activity.model.ActivityType;
import atomdance.app.modules.activity.repository.UserActivityRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Drops activity records once they stop being worth showing.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityPurgeService {

	private static final Duration FINANCIAL_RETENTION = Duration.ofDays(5 * 365);
	private static final Duration BUSINESS_RECORD_RETENTION = Duration.ofDays(365);
	private static final Duration DEFAULT_RETENTION = Duration.ofDays(90);

	/**
	 * How long each kind of record is kept.
	 */
	private static final Map<ActivityType, Duration> RETENTION = new EnumMap<>(Map.ofEntries(
			Map.entry(ActivityType.EMAIL_VERIFICATION, DEFAULT_RETENTION),
			Map.entry(ActivityType.SYSTEM_CLEANUP, DEFAULT_RETENTION),
			Map.entry(ActivityType.EMAIL_DELIVERY, DEFAULT_RETENTION),
			Map.entry(ActivityType.USER_CREATION, DEFAULT_RETENTION),
			Map.entry(ActivityType.USER_MANAGEMENT, DEFAULT_RETENTION),

			Map.entry(ActivityType.PERSON_PREVIEW, DEFAULT_RETENTION),
			Map.entry(ActivityType.FAMILY_PREVIEW, DEFAULT_RETENTION),
			Map.entry(ActivityType.GROUP_PREVIEW, DEFAULT_RETENTION),
			Map.entry(ActivityType.MEMBERSHIP_PREVIEW, DEFAULT_RETENTION),
			Map.entry(ActivityType.INSTRUCTOR_PREVIEW, DEFAULT_RETENTION),

			Map.entry(ActivityType.DISCOUNT_PREVIEW, DEFAULT_RETENTION),
			Map.entry(ActivityType.LIST_PREVIEW, DEFAULT_RETENTION),
			Map.entry(ActivityType.PAYMENT_PREVIEW, DEFAULT_RETENTION),
			Map.entry(ActivityType.TRANSACTION_PREVIEW, DEFAULT_RETENTION),

			Map.entry(ActivityType.PERSON_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(ActivityType.FAMILY_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(ActivityType.GROUP_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(ActivityType.MEMBERSHIP_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(ActivityType.INSTRUCTOR_MANAGEMENT, BUSINESS_RECORD_RETENTION),

			Map.entry(ActivityType.DISCOUNT_MANAGEMENT, FINANCIAL_RETENTION),
			Map.entry(ActivityType.LIST_MANAGEMENT, FINANCIAL_RETENTION),
			Map.entry(ActivityType.PAYMENT_MANAGEMENT, FINANCIAL_RETENTION),
			Map.entry(ActivityType.TRANSACTION_MANAGEMENT, FINANCIAL_RETENTION)
	));

	private final UserActivityRepository repository;
	private final UserActivityLogger activityLogger;

	@PostConstruct
	void warnAboutUnmappedTypes() {
		Set<ActivityType> unmapped = EnumSet.allOf(ActivityType.class);
		unmapped.removeAll(RETENTION.keySet());

		if (!unmapped.isEmpty()) {
			log.warn("No explicit retention for {} - falling back to {} days", unmapped, DEFAULT_RETENTION.toDays());
		}
	}

	@Scheduled(cron = "0 30 3 * * *", zone = "${app.time-zone}")
	@Transactional
	public void purgeExpiredActivities() {
		Instant now = Instant.now();
		int total = 0;

		for (ActivityType type : ActivityType.values()) {
			Duration retention = RETENTION.getOrDefault(type, DEFAULT_RETENTION);
			int deleted = repository.deleteByTypeOccurredBefore(type, now.minus(retention));

			if (deleted > 0) {
				log.debug("Purged {} {} record(s) older than {} days", deleted, type, retention.toDays());
				activityLogger.recordOnCommit(null, ActivityType.SYSTEM_CLEANUP, ActivityStatus.SUCCESS, String.format("Purged %d %s record(s) older than %d days.", deleted, type, retention.toDays()));

				total += deleted;
			}
		}

		if (total > 0) {
			log.info("Purged {} expired activity record(s) in total", total);
			activityLogger.recordOnCommit(null, ActivityType.SYSTEM_CLEANUP, ActivityStatus.SUCCESS, String.format("Purged %d expired activity record(s) in total.", total));
		}
	}
}
