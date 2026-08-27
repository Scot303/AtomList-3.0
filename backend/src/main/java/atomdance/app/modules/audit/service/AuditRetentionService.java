package atomdance.app.modules.audit.service;

import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.repository.AuditEventRepository;
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
 * Drops audit events once they pass the retention period for their type.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditRetentionService {

	private static final Duration FINANCIAL_RETENTION = Duration.ofDays(365L * 5);
	private static final Duration BUSINESS_RECORD_RETENTION = Duration.ofDays(365L);
	private static final Duration DEFAULT_RETENTION = Duration.ofDays(90L);

	/**
	 * How long each kind of event is kept.
	 */
	private static final Map<AuditEventType, Duration> RETENTION = new EnumMap<>(Map.ofEntries(
			Map.entry(AuditEventType.EMAIL_VERIFICATION, DEFAULT_RETENTION),
			Map.entry(AuditEventType.SYSTEM_CLEANUP, DEFAULT_RETENTION),
			Map.entry(AuditEventType.EMAIL_DELIVERY, DEFAULT_RETENTION),
			Map.entry(AuditEventType.USER_CREATION, DEFAULT_RETENTION),
			Map.entry(AuditEventType.USER_MANAGEMENT, DEFAULT_RETENTION),

			Map.entry(AuditEventType.PERSON_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.FAMILY_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.GROUP_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.MEMBERSHIP_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.INSTRUCTOR_PREVIEW, DEFAULT_RETENTION),

			Map.entry(AuditEventType.DISCOUNT_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.LIST_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.PAYMENT_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.TRANSACTION_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.SMS_CREATION, DEFAULT_RETENTION),
			Map.entry(AuditEventType.SMS_SEND, DEFAULT_RETENTION),
			Map.entry(AuditEventType.SMS_PREVIEW, DEFAULT_RETENTION),
			Map.entry(AuditEventType.ATTENDANCE_PDF_CREATION, DEFAULT_RETENTION),

			Map.entry(AuditEventType.PERSON_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(AuditEventType.FAMILY_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(AuditEventType.GROUP_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(AuditEventType.MEMBERSHIP_MANAGEMENT, BUSINESS_RECORD_RETENTION),
			Map.entry(AuditEventType.INSTRUCTOR_MANAGEMENT, BUSINESS_RECORD_RETENTION),

			Map.entry(AuditEventType.DISCOUNT_MANAGEMENT, FINANCIAL_RETENTION),
			Map.entry(AuditEventType.LIST_MANAGEMENT, FINANCIAL_RETENTION),
			Map.entry(AuditEventType.PAYMENT_MANAGEMENT, FINANCIAL_RETENTION),
			Map.entry(AuditEventType.TRANSACTION_MANAGEMENT, FINANCIAL_RETENTION)
	));

	private final AuditEventRepository repository;
	private final AuditLogger auditLogger;


	@PostConstruct
	void warnAboutUnmappedTypes() {
		Set<AuditEventType> unmapped = EnumSet.allOf(AuditEventType.class);
		unmapped.removeAll(RETENTION.keySet());

		if (!unmapped.isEmpty()) {
			log.warn("No explicit retention for {} - falling back to {} days", unmapped, DEFAULT_RETENTION.toDays());
		}
	}


	@Scheduled(cron = "0 30 2 * * *", zone = "UTC")
	@Transactional
	public void purgeExpiredEvents() {
		Instant now = Instant.now();
		int total = 0;

		for (AuditEventType type : AuditEventType.values()) {
			Duration retention = RETENTION.getOrDefault(type, DEFAULT_RETENTION);
			int deleted = repository.deleteByTypeOccurredBefore(type, now.minus(retention));

			if (deleted > 0) {
				log.debug("Purged {} {} event(s) older than {} days", deleted, type, retention.toDays());
				auditLogger.recordOnCommit(null, AuditEventType.SYSTEM_CLEANUP, AuditOutcome.SUCCESS, String.format("Purged %d %s event(s) older than %d days.", deleted, type, retention.toDays()));

				total += deleted;
			}
		}

		if (total > 0) {
			log.info("Purged {} expired audit event(s) in total", total);
			auditLogger.recordOnCommit(null, AuditEventType.SYSTEM_CLEANUP, AuditOutcome.SUCCESS, String.format("Purged %d expired audit event(s) in total.", total));
		}
	}
}
