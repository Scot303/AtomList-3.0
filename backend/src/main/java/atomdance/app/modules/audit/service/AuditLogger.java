package atomdance.app.modules.audit.service;

import atomdance.app.modules.audit.model.AuditEvent;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.UUID;

/**
 * Records the audit trail.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogger {

	private final AuditEventWriter writer;

	/**
	 * Commits now, on its own transaction, independent of the caller's.
	 *
	 * @param actorId  who performed the action, or {@code null} for the system
	 * @param targetId what the action was performed on, or {@code null} if it was performed on nothing in particular
	 */
	public void record(UUID actorId, UUID targetId, AuditEventType type, AuditOutcome outcome, String message) {
		write(build(actorId, targetId, type, outcome, message, Instant.now()));
	}

	/**
	 * For actions with no subject beyond the actor themselves.
	 */
	public void record(UUID actorId, AuditEventType type, AuditOutcome outcome, String message) {
		record(actorId, null, type, outcome, message);
	}

	/**
	 * Commits after - and only if - the caller's transaction commits.
	 *
	 * @param actorId  who performed the action, or {@code null} for the system
	 * @param targetId what the action was performed on, or {@code null} if it was performed on nothing in particular
	 */
	public void recordOnCommit(UUID actorId, UUID targetId, AuditEventType type, AuditOutcome outcome, String message) {
		AuditEvent event = build(actorId, targetId, type, outcome, message, Instant.now());

		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			write(event);

			return;
		}

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				write(event);
			}
		});
	}

	/**
	 * For actions with no subject beyond the actor themselves.
	 */
	public void recordOnCommit(UUID actorId, AuditEventType type, AuditOutcome outcome, String message) {
		recordOnCommit(actorId, null, type, outcome, message);
	}

	private void write(AuditEvent event) {
		try {
			writer.write(event);
		} catch (Exception e) {
			String actorId = event.getActorId() != null ? event.getActorId().toString() : "SYSTEM";
			log.warn("Could not record {} for actor {}", event.getType(), actorId, e);
		}
	}

	private AuditEvent build(UUID actorId, UUID targetId, AuditEventType type, AuditOutcome outcome, String message, Instant occurredAt) {
		return AuditEvent.builder()
				.actorId(actorId)
				.targetId(targetId)
				.type(type)
				.outcome(outcome)
				.message(message)
				.occurredAt(occurredAt)
				.build();
	}
}
