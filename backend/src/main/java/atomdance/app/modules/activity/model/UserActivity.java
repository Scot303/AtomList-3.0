package atomdance.app.modules.activity.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "user_activities",
		indexes = {
				@Index(name = "idx_user_activities_user_id_occurred_at", columnList = "user_id, occurredAt"),
				@Index(name = "idx_user_activities_affected_record_id_occurred_at", columnList = "affected_record_id, occurredAt")
		})
public class UserActivity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	/**
	 * Who performed the action. {@code null} for anything the system did on its own.
	 */
	@Column(name = "user_id")
	private UUID userId;

	/**
	 * What the action was performed on.
	 */
	@Column(name = "affected_record_id")
	private UUID affectedRecordId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 64)
	private ActivityType type;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ActivityStatus status;

	@Column(nullable = false)
	private Instant occurredAt;

	@Column(nullable = false, length = 512)
	private String message;
}
