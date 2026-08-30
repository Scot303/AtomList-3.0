package atomdance.app.modules.audit.service;

import atomdance.app.modules.audit.model.AuditEvent;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.event.Level;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.UUID;


/**
 * Records the audit trail, and writes the matching console line.
 * <p>
 * Pick the method by intent, not by transaction semantics:
 * <ul>
 *     <li>{@link #success} for anything that changed state - recorded after the caller's transaction commits, so nothing is claimed that was rolled back.</li>
 *     <li>{@link #read} for previews - recorded immediately, and quiet on the console by default.</li>
 *     <li>{@link #failure} for a refused or broken action - recorded immediately, since the caller's transaction is usually about to roll back.</li>
 * </ul>
 * The {@code system*} variants force {@code SYSTEM} as the actor for work that is never anybody's doing - scheduled jobs, mail delivery - even when a security context happens to be around. Everything else resolves the actor itself and falls back to {@code SYSTEM} off-request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogger {

	private static final Level READ_LEVEL = Level.DEBUG;

	private static final String SYSTEM_ACTOR = "SYSTEM";

	private final AuditEventWriter writer;
	private final SecurityService securityService;


	/**
	 * A state change by the current user, recorded after - and only if - the caller's transaction commits.
	 *
	 * @param targetId what the action was performed on, or {@code null} if it was performed on nothing in particular
	 * @param message  a {@link String#format} template; the audit row and the console line both get the formatted result
	 */
	public void success(AuditEventType type, UUID targetId, String message, Object... args) {
		success(Level.INFO, type, targetId, message, args);
	}


	/**
	 * As {@link #success}, at the console level given. For the rare change that deserves more attention than an {@code INFO} line.
	 */
	public void success(Level level, AuditEventType type, UUID targetId, String message, Object... args) {
		onCommit(currentActorId(), currentActorName(), targetId, type, level, message, args);
	}


	/**
	 * A state change by the current user that has already happened somewhere the caller's transaction cannot undo - a mail sent, a file produced - so it is recorded immediately rather than on commit.
	 * Prefer {@link #success} for anything that lives purely in the database.
	 */
	public void successNow(AuditEventType type, UUID targetId, String message, Object... args) {
		successNow(Level.INFO, type, targetId, message, args);
	}


	/**
	 * As {@link #successNow}, at the console level given.
	 */
	public void successNow(Level level, AuditEventType type, UUID targetId, String message, Object... args) {
		now(currentActorId(), currentActorName(), targetId, type, AuditOutcome.SUCCESS, level, message, args);
	}


	/**
	 * As {@link #success}, but always attributed to the system rather than to whoever happens to be signed in.
	 */
	public void systemSuccess(AuditEventType type, UUID targetId, String message, Object... args) {
		systemSuccess(Level.INFO, type, targetId, message, args);
	}


	/**
	 * As {@link #systemSuccess}, at the console level given.
	 */
	public void systemSuccess(Level level, AuditEventType type, UUID targetId, String message, Object... args) {
		onCommit(null, SYSTEM_ACTOR, targetId, type, level, message, args);
	}


	/**
	 * As {@link #successNow}, but always attributed to the system rather than to whoever happens to be signed in.
	 */
	public void systemSuccessNow(AuditEventType type, UUID targetId, String message, Object... args) {
		now(null, SYSTEM_ACTOR, targetId, type, AuditOutcome.SUCCESS, Level.INFO, message, args);
	}


	/**
	 * A preview by the current user, recorded immediately on its own transaction.
	 */
	public void read(AuditEventType type, UUID targetId, String message, Object... args) {
		read(READ_LEVEL, type, targetId, message, args);
	}


	/**
	 * As {@link #read}, at the console level given.
	 */
	public void read(Level level, AuditEventType type, UUID targetId, String message, Object... args) {
		now(currentActorId(), currentActorName(), targetId, type, AuditOutcome.SUCCESS, level, message, args);
	}


	/**
	 * A refused or broken action, recorded immediately on its own transaction - the caller's is usually about to roll back.
	 */
	public void failure(AuditEventType type, UUID targetId, String message, Object... args) {
		failure(Level.ERROR, type, targetId, message, args);
	}


	/**
	 * As {@link #failure}, at the console level given. For the expected refusals that are not worth an {@code ERROR}.
	 */
	public void failure(Level level, AuditEventType type, UUID targetId, String message, Object... args) {
		now(currentActorId(), currentActorName(), targetId, type, AuditOutcome.FAILURE, level, message, args);
	}


	/**
	 * As {@link #failure}, but always attributed to the system rather than to whoever happens to be signed in.
	 */
	public void systemFailure(AuditEventType type, UUID targetId, String message, Object... args) {
		systemFailure(Level.ERROR, type, targetId, message, args);
	}


	/**
	 * As {@link #systemFailure}, at the console level given.
	 */
	public void systemFailure(Level level, AuditEventType type, UUID targetId, String message, Object... args) {
		now(null, SYSTEM_ACTOR, targetId, type, AuditOutcome.FAILURE, level, message, args);
	}


	private void now(UUID actorId, String actorName, UUID targetId, AuditEventType type, AuditOutcome outcome, Level level, String message, Object... args) {
		emit(build(actorId, targetId, type, outcome, message, args), actorName, level);
	}


	private void onCommit(UUID actorId, String actorName, UUID targetId, AuditEventType type, Level level, String message, Object... args) {
		// Both the actor and the message are resolved here rather than in the callback, while the security context and the entity state are still what the caller saw.
		AuditEvent event = build(actorId, targetId, type, AuditOutcome.SUCCESS, message, args);

		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			emit(event, actorName, level);

			return;
		}

		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				emit(event, actorName, level);
			}
		});
	}


	/**
	 * Logs before writing, so the console line survives a failed insert.
	 */
	private void emit(AuditEvent event, String actorName, Level level) {
		log.atLevel(level).log(line(event, actorName));

		try {
			writer.write(event);
		} catch (Exception e) {
			log.warn("Could not record {} for actor {}", event.getType(), actorName, e);
		}
	}


	private String line(AuditEvent event, String actorName) {
		StringBuilder line = new StringBuilder(event.getType().name())
				.append(' ').append(event.getOutcome())
				.append(" actor=").append(actorName);

		if (event.getTargetId() != null) {
			line.append(" target=").append(event.getTargetId());
		}

		return line.append(" - ").append(event.getMessage()).toString();
	}


	private AuditEvent build(UUID actorId, UUID targetId, AuditEventType type, AuditOutcome outcome, String message, Object... args) {
		return AuditEvent.builder()
				.actorId(actorId)
				.targetId(targetId)
				.type(type)
				.outcome(outcome)
				.message(format(message, args))
				.occurredAt(Instant.now())
				.build();
	}


	/**
	 * Left alone when there is nothing to substitute, so a message carrying a bare {@code %} cannot blow up.
	 */
	private String format(String message, Object... args) {
		return args == null || args.length == 0 ? message : String.format(message, args);
	}


	private UUID currentActorId() {
		try {
			return securityService.getCurrentUserId();
		} catch (RuntimeException e) {
			return null;
		}
	}


	private String currentActorName() {
		try {
			return securityService.getCurrentUsername();
		} catch (RuntimeException e) {
			return SYSTEM_ACTOR;
		}
	}
}
