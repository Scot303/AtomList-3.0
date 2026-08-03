package atomdance.app.modules.audit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "audit_events",
		indexes = {
				@Index(name = "idx_audit_events_actor_id_occurred_at", columnList = "actor_id, occurredAt"),
				@Index(name = "idx_audit_events_target_id_occurred_at", columnList = "target_id, occurredAt")
		})
public class AuditEvent {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/**
	 * Who performed the action. {@code null} for anything the system did on its own.
	 */
	@Column(name = "actor_id")
	private UUID actorId;

	/**
	 * What the action was performed on.
	 */
	@Column(name = "target_id")
	private UUID targetId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 64)
	private AuditEventType type;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private AuditOutcome outcome;

	@Column(nullable = false)
	private Instant occurredAt;

	@Column(nullable = false, length = 1024)
	private String message;
}
