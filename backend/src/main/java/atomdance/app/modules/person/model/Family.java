package atomdance.app.modules.person.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A household. Exists mainly so siblings can share one contact number and one discount ladder.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "families", indexes = @Index(name = "idx_families_name", columnList = "name"))
public class Family {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 128)
	private String name;

	@Column(length = 9)
	private String phone;

	@Column(length = 255)
	private String email;

	@Column(length = 512)
	private String note;

	@OneToMany(mappedBy = "family", fetch = FetchType.LAZY)
	@Builder.Default
	private List<Person> persons = new ArrayList<>();

	@Column(nullable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}
}
