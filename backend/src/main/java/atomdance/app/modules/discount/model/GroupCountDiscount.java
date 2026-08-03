package atomdance.app.modules.discount.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * The discount somebody gets for attending several groups at once.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "group_count_discounts", uniqueConstraints = @UniqueConstraint(name = "uk_group_count_discounts_group_count", columnNames = "groupCount"))
public class GroupCountDiscount {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	/**
	 * The number of groups attended.
	 */
	@Column(nullable = false)
	private int groupCount;

	@Column(nullable = false, precision = 5, scale = 2)
	private BigDecimal percent;
}
