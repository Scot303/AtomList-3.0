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

	/**
	 * What to bill for the month this person joined, when they came in part-way through it and should not pay for
	 * the whole of it. {@code null} bills the usual rate from the start.
	 */
	@Column(name = "first_month_cost", precision = 12, scale = 2)
	private BigDecimal firstMonthCost;

	@Column(length = 512)
	private String note;


	public boolean isActive() {
		return leftAt == null;
	}


	public boolean joinedMidMonth() {
		return joinedAt.getDayOfMonth() > 1;
	}


	public YearMonth joinMonth() {
		return YearMonth.from(joinedAt);
	}


	/**
	 * The standing rate, honoring an individually agreed amount over the group default.
	 */
	public BigDecimal resolveUnitCost() {
		return customMonthlyCost != null ? customMonthlyCost : group.getCostForAttending();
	}


	/**
	 * The rate to bill for one month: the agreed part-month amount for the month they joined, the standing rate for every month after it.
	 */
	public BigDecimal resolveUnitCostFor(YearMonth month) {
		if (firstMonthCost != null && month != null && month.equals(joinMonth())) {
			return firstMonthCost;
		}

		return resolveUnitCost();
	}
}
