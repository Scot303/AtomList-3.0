package atomdance.app.modules.activity.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "user_activities",
		indexes = @Index(name = "idx_user_activities_user_id_occurred_at", columnList = "user_id, occurredAt"))
public class UserActivity {

	@Id
	private Long id;

	@Column(name = "user_id")
	private UUID userId;

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
