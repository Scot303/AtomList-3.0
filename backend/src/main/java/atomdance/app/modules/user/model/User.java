package atomdance.app.modules.user.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.*;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(unique = true, nullable = false, length = 64)
	private String username;

	@Column(unique = true, nullable = false, length = 255)
	private String email;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 64)
	private Role role;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "user_additional_permissions", joinColumns = @JoinColumn(name = "user_id"))
	@Enumerated(EnumType.STRING)
	@Column(name = "permission", nullable = false, length = 64)
	@Builder.Default
	private Set<Permission> additionalPermissions = new HashSet<>();

	@Column(nullable = false)
	@Builder.Default
	private int tokenVersion = 0;

	@Column(name = "is_active", nullable = false)
	@Builder.Default
	private boolean isActive = true;

	@Column(name = "is_email_verified", nullable = false)
	@Builder.Default
	private boolean isEmailVerified = false;

	@Column(nullable = false)
	@Builder.Default
	private int failedLoginAttempts = 0;

	private Instant lockedUntil;

	private Instant lastLoginAt;

	public Set<Permission> getAllPermissions() {
		Set<Permission> allPerms = EnumSet.noneOf(Permission.class);
		allPerms.addAll(role.getPermissions());
		allPerms.addAll(additionalPermissions);

		return Collections.unmodifiableSet(allPerms);
	}

	public boolean isLockedAt(Instant now) {
		return lockedUntil != null && lockedUntil.isAfter(now);
	}

	public static String normalizeEmail(String email) {
		return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
	}
}
