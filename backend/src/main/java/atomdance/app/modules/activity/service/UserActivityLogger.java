package atomdance.app.modules.activity.service;

import atomdance.app.modules.activity.model.ActivityStatus;
import atomdance.app.modules.activity.model.ActivityType;
import atomdance.app.modules.activity.model.UserActivity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityLogger {

	private final UserActivityWriter writer;

	/**
	 * Commits now, on its own transaction, independent of the caller's.
	 *
	 * @param userId            who performed the action, or {@code null} for the system
	 * @param affectedRecordId  what the action was performed on, or {@code null} if it was performed on nothing in particular
	 */
	public void record(UUID userId, UUID affectedRecordId, ActivityType type, ActivityStatus status, String message) {
		write(build(userId, affectedRecordId, type, status, message, Instant.now()));
	}

	/**
	 * For actions with no subject beyond the actor themselves.
	 */
	public void record(UUID userId, ActivityType type, ActivityStatus status, String message) {
		record(userId, null, type, status, message);
	}

	/**
	 * Commits after - and only if - the caller's transaction commits.
	 *
	 * @param userId            who performed the action, or {@code null} for the system
	 * @param affectedRecordId  what the action was performed on, or {@code null} if it was performed on nothing in particular
	 */
	public void recordOnCommit(UUID userId, UUID affectedRecordId, ActivityType type, ActivityStatus status, String message) {
		UserActivity activity = build(userId, affectedRecordId, type, status, message, Instant.now());

		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			write(activity);

			return;
		}

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				write(activity);
			}
		});
	}

	/**
	 * For actions with no subject beyond the actor themselves.
	 */
	public void recordOnCommit(UUID userId, ActivityType type, ActivityStatus status, String message) {
		recordOnCommit(userId, null, type, status, message);
	}

	private void write(UserActivity activity) {
		try {
			writer.write(activity);
		} catch (Exception e) {
			String userId = activity.getUserId() != null ? activity.getUserId().toString() : "SYSTEM";
			log.warn("Could not record {} for user {}", activity.getType(), userId, e);
		}
	}

	private UserActivity build(UUID userId, UUID affectedRecordId, ActivityType type, ActivityStatus status, String message, Instant occurredAt) {
		return UserActivity.builder()
				.userId(userId)
				.affectedRecordId(affectedRecordId)
				.type(type)
				.status(status)
				.message(message)
				.occurredAt(occurredAt)
				.build();
	}
}
