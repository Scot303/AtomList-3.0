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

	/**
	 * How long each kind of record is kept.
	 */
	private static final Map<ActivityType, Duration> RETENTION = new EnumMap<>(Map.of(
			ActivityType.EMAIL_VERIFICATION, Duration.ofDays(30),
			ActivityType.SYSTEM_CLEANUP, Duration.ofDays(60)
	));

	private static final Duration DEFAULT_RETENTION = Duration.ofDays(90);

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
