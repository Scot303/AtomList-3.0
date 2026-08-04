package atomdance.app.modules.group.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A class people attend and are billed for.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "groups", indexes = @Index(name = "idx_groups_name", columnList = "name"))
public class Group {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 128)
	private String name;

	@Column(name = "is_tournament_group", nullable = false)
	@Builder.Default
	private boolean isTournamentGroup = false;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal costForAttending;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	@Builder.Default
	private GroupBillingType billingType = GroupBillingType.MONTHLY;

	@Column(name = "is_active", nullable = false)
	@Builder.Default
	private boolean isActive = true;

	@Column(length = 512)
	private String note;

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public boolean isPerClass() {
		return billingType == GroupBillingType.PER_CLASS;
	}
}
