package atomdance.app.modules.user.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(unique = true, nullable = false, length = 64)
	private String username;

	@Column(unique = true, nullable = false, length = 64)
	private String email;

	@Column(nullable = false)
	private String password;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 64)
	private Role role;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "user_additional_permissions", joinColumns = @JoinColumn(name = "user_id"))
	@Enumerated(EnumType.STRING)
	@Column(name = "permission", nullable = false, length = 64)
	@Builder.Default
	private Set<Permission> additionalPermissions = new HashSet<>();

	public Set<Permission> getAllPermissions() {
		Set<Permission> allPerms = new HashSet<>(role.getPermissions());
		allPerms.addAll(additionalPermissions);

		return allPerms;
	}

	@Column(nullable = false, columnDefinition = "integer not null default 0")
	@Builder.Default
	private int tokenVersion = 0;

}