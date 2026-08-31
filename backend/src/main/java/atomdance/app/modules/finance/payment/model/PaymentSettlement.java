package atomdance.app.modules.finance.payment.model;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.deposit.model.Deposit;
import atomdance.app.modules.finance.deposit.model.DepositOrigin;
import atomdance.app.modules.finance.deposit.model.PaymentMethod;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;


/**
 * One act of settling: some of a {@link Deposit}'s money clearing some of a {@link Payment}'s debt.
 * <p>
 * Several of these against one payment are how a split payment is recorded - 200 in cash today, 200 by transfer next week, each with its own amount and date.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "payment_settlements",
		uniqueConstraints = @UniqueConstraint(name = "uk_payment_settlements_payment_number", columnNames = {"payment_id", "number"}),
		indexes = {
				@Index(name = "idx_payment_settlements_deposit_id", columnList = "deposit_id")
		})
public class PaymentSettlement {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	/**
	 * The settlement's half of "P-1234/1" - see {@link #getCode()}.
	 */
	@Column(name = "number", nullable = false, updatable = false)
	@Setter(AccessLevel.PACKAGE)
	private Long number;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "payment_id", nullable = false)
	private Payment payment;

	/**
	 * Where the money came from. Always set - there is no such thing as settled money that nobody handed
	 * over, and a single quick payment gets a {@link DepositOrigin#DIRECT} deposit of its own rather than
	 * a second way of holding cash.
	 */
	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "deposit_id", nullable = false)
	private Deposit deposit;

	@Column(nullable = false, precision = 12, scale = 2)
	@Builder.Default
	private BigDecimal amount = Money.ZERO;

	/**
	 * Whether this money is reported as income on the list its payment sits on.
	 * <p>
	 * {@code false} makes this a <em>clearance</em>: the debt is settled so nobody chases it, but the cash
	 * is counted in the month its deposit was booked to instead. That is the case for arrears - a debt on a
	 * month already sent to the accountants, or on any month other than the deposit's own.
	 * <p>
	 * Decided once, when the settlement is written, and never recomputed. A closed list's figures must not
	 * be able to move afterwards, so this records a decision rather than deriving one.
	 */
	@Column(name = "is_carrying_money", nullable = false)
	@Builder.Default
	private boolean isCarryingMoney = true;

	/**
	 * When this was recorded, which is later than the deposit's own {@code receivedAt} when leftover credit is spent in a second sitting.
	 */
	@Column(name = "settled_at", nullable = false)
	private Instant settledAt;

	@Column(name = "created_by_user_id")
	private UUID createdByUserId;


	@PrePersist
	void onCreate() {
		if (settledAt == null) {
			settledAt = Instant.now();
		}
	}


	public String getCode() {
		return payment == null ? null : PaymentCode.formatLine(payment.getCode(), number);
	}


	public boolean isClearance() {
		return !isCarryingMoney;
	}


	public PaymentMethod getPaymentMethod() {
		return deposit == null ? null : deposit.getPaymentMethod();
	}
}
