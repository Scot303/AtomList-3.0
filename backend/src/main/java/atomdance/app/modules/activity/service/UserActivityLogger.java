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
	 */
	public void record(UUID userId, ActivityType type, ActivityStatus status, String message) {
		write(build(userId, type, status, message, Instant.now()));
	}


	/**
	 * Commits after - and only if - the caller's transaction commits.
	 */
	public void recordOnCommit(UUID userId, ActivityType type, ActivityStatus status, String message) {
		UserActivity activity = build(userId, type, status, message, Instant.now());

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

	private void write(UserActivity activity) {
		try {
			writer.write(activity);
		} catch (Exception e) {
			String userId = activity.getUserId() != null ? activity.getUserId().toString() : "SYSTEM";
			log.warn("Could not record {} for user {}", activity.getType(), userId, e);
		}
	}

	private UserActivity build(UUID userId, ActivityType type, ActivityStatus status, String message, Instant occurredAt) {
		return UserActivity.builder()
				.userId(userId)
				.type(type)
				.status(status)
				.message(message)
				.occurredAt(occurredAt)
				.build();
	}
}
