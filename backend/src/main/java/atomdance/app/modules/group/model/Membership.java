package atomdance.app.modules.group.model;

import atomdance.app.modules.person.model.Person;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "memberships",
		indexes = {
				@Index(name = "idx_memberships_person_id", columnList = "person_id"),
				@Index(name = "idx_memberships_group_id", columnList = "group_id")
		})
public class Membership {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "person_id", nullable = false)
	private Person person;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "group_id", nullable = false)
	private Group group;

	@Column(nullable = false)
	private LocalDate joinedAt;

	/**
	 * {@code null} while the membership is running.
	 */
	private LocalDate leftAt;

	/**
	 * An individually agreed monthly amount, replacing the group's default.
	 */
	@Column(precision = 12, scale = 2)
	private BigDecimal customMonthlyCost;

	@Column(length = 512)
	private String note;

	public boolean isActive() {
		return leftAt == null;
	}

	/**
	 * Whether this membership was running at any point during the given month, which is what decides if it appears on that month's list.
	 */
	public boolean wasActiveDuring(YearMonth month) {
		boolean startedByEndOfMonth = !joinedAt.isAfter(month.atEndOfMonth());
		boolean notYetLeftAtStartOfMonth = leftAt == null || !leftAt.isBefore(month.atDay(1));

		return startedByEndOfMonth && notYetLeftAtStartOfMonth;
	}

	/**
	 * The rate to bill, honoring an individually agreed amount over the group default.
	 */
	public BigDecimal resolveUnitCost() {
		return customMonthlyCost != null ? customMonthlyCost : group.getCostForAttending();
	}
}
