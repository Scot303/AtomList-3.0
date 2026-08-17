package atomdance.app.modules.finance.model;

import atomdance.app.modules.finance.exception.ListClosedException;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.YearMonth;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;


/**
 * A billing sheet: one of the month's two standard lists, or an ad-hoc one a manager assembled.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "payment_lists", uniqueConstraints = @UniqueConstraint(name = "uk_payment_lists_month_year_type", columnNames = {"month", "year", "type"}),
		indexes = {
				@Index(name = "idx_payment_lists_type_status", columnList = "type, status"),
				@Index(name = "idx_payment_lists_year_month", columnList = "year, month")
		})
public class PaymentList {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ListType type;

	/**
	 * Set on standard lists only.
	 */
	@Column(name = "month")
	private Integer month;

	@Column(name = "year")
	private Integer year;

	/**
	 * Set on custom and camp lists only.
	 */
	@Column(length = 255)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	@Builder.Default
	private ListStatus status = ListStatus.OPEN;

	private Instant closedAt;

	@Column(name = "closed_by_user_id")
	private UUID closedByUserId;

	/**
	 * How a custom list chose its people, so a repopulate can repeat the same choice.
	 */
	@Enumerated(EnumType.STRING)
	@Column(length = 32)
	private ListPopulationMode populationMode;

	/**
	 * The groups a {@link ListPopulationMode#BY_GROUPS} list was built from.
	 * Kept so the choice can be replayed later - somebody who joins one of these groups after the list was
	 * created should be addable without the manager having to remember which groups they picked.
	 */
	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "payment_list_source_groups", joinColumns = @JoinColumn(name = "list_id"))
	@Column(name = "group_id", nullable = false)
	@Builder.Default
	private Set<UUID> sourceGroupIds = new HashSet<>();

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


	public boolean isStandard() {
		return type.isStandard();
	}


	public boolean isTournament() {
		return type.isTournament();
	}


	/**
	 * @return the account the charges on this list are paid into, which decides whose credit may settle them
	 */
	public DepositScope scope() {
		return type.scope();
	}


	/**
	 * @return whether every charge on this list has to name a group
	 */
	public boolean requiresGroup() {
		return type.requiresGroup();
	}


	public boolean isClosed() {
		return status == ListStatus.CLOSED;
	}


	public boolean tracksContracts() {
		return type.tracksContracts();
	}


	//TODO this will need to be changed after instructor can store multiple contracts
	public boolean carriesInstructorPay() {
		return isStandard() && !isTournament();
	}


	/**
	 * @return the month this list bills, or {@code null} if it is not a standard list.
	 */
	public YearMonth yearMonth() {
		if (month == null || year == null) {
			return null;
		}

		return YearMonth.of(year, month);
	}


	public void assertOpen() {
		if (isClosed()) {
			throw new ListClosedException();
		}
	}
}
