package atomdance.app.modules.finance.model;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.instructor.model.Instructor;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "transactions",
		indexes = {
				@Index(name = "idx_transactions_list_id_type", columnList = "list_id, type"),
				@Index(name = "idx_transactions_instructor_id", columnList = "instructor_id")
		})
public class Transaction {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "list_id", nullable = false)
	private PaymentList list;

	@Column(nullable = false, length = 1024)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private TransactionType type;

	@Column(nullable = false, precision = 12, scale = 2)
	@Builder.Default
	private BigDecimal amount = Money.ZERO;

	@Column(nullable = false, precision = 12, scale = 2)
	@Builder.Default
	private BigDecimal quantity = BigDecimal.ONE;

	@Column(length = 64)
	private String invoiceNumber;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "instructor_id")
	private Instructor instructor;

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


	public BigDecimal getTotal() {
		return Money.multiply(amount, quantity);
	}
}
