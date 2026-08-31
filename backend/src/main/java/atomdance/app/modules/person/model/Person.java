package atomdance.app.modules.person.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import java.util.UUID;


@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "persons",
		indexes = {
				@Index(name = "idx_persons_family_id", columnList = "family_id"),
				@Index(name = "idx_persons_last_name", columnList = "lastName, name")
		})
public class Person {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 64)
	private String name;

	@Column(nullable = false, length = 64)
	private String lastName;

	/**
	 * An override for the family's number, for somebody reachable directly. Read through
	 * {@link #getEffectivePhone()} rather than on its own.
	 */
	@Column(length = 9)
	private String phone;

	@Column(length = 255)
	private String email;

	private LocalDate dateOfBirth;

	@Column(nullable = false)
	private LocalDate joinedStudioAt;

	private LocalDate joinedClubDate;

	private LocalDate leftClubDate;

	@Column(name = "is_active", nullable = false)
	@Builder.Default
	private boolean isActive = true;

	@Column(name = "is_contract_signed", nullable = false)
	@Builder.Default
	private boolean isContractSigned = false;

	@Column(name = "student_discount", nullable = false, columnDefinition = "boolean default false")
	@Builder.Default
	private boolean studentDiscount = false;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "family_id")
	private Family family;

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


	public String getEffectivePhone() {
		if (phone != null && !phone.isBlank()) {
			return phone;
		}

		return family == null ? null : family.getPhone();
	}


	public String getFullName() {
		return name + " " + lastName;
	}


	public static String normalizePhone(String phone) {
		if (phone == null) {
			return null;
		}

		String stripped = phone.replaceAll("[\\s()\\-.]", "");

		return stripped.isEmpty() ? null : stripped;
	}


	public static String normalizeEmail(String email) {
		if (email == null) {
			return null;
		}

		String trimmed = email.trim().toLowerCase(Locale.ROOT);

		return trimmed.isEmpty() ? null : trimmed;
	}
}
