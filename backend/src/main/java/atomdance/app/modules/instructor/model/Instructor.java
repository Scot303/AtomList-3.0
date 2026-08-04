package atomdance.app.modules.instructor.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "instructors", indexes = @Index(name = "idx_instructors_last_name", columnList = "lastName, name"))
public class Instructor {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 128)
	private String name;

	@Column(nullable = false, length = 128)
	private String lastName;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal costPerHour;

	private LocalDate contractSignedDate;

	@Column(length = 64)
	private String contractNumber;

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

	public String getFullName() {
		return name + " " + lastName;
	}
}
