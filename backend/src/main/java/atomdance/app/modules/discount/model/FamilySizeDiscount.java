package atomdance.app.modules.discount.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * The discount the n-th person in a household gets.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "family_size_discounts", uniqueConstraints = @UniqueConstraint(name = "uk_family_size_discounts_position", columnNames = "position"))
public class FamilySizeDiscount {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	/**
	 * Which person in the family this applies to, counting from 1.
	 */
	@Column(name = "position", nullable = false)
	private int position;

	@Column(nullable = false, precision = 5, scale = 2)
	private BigDecimal percent;
}
