package atomdance.app.modules.user.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A one-time code emailed to a user so they can sign in. Replaces the password entirely.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "login_codes",
		indexes = {@Index(name = "idx_login_codes_user_id", columnList = "user_id"), @Index(name = "idx_login_codes_expires_at", columnList = "expiresAt")})
public class LoginCode {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "code_hash", nullable = false, length = 255)
	private String codeHash;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/**
	 * Wrong guesses against this particular code. Once it reaches the configured ceiling, the code is burned.
	 */
	@Column(nullable = false)
	@Builder.Default
	private int attempts = 0;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant expiresAt;

	/**
	 * Set when the code is spent, superseded by a newer one, or burned through failed attempts.
	 * A consumed row is never accepted again.
	 */
	private Instant consumedAt;

}
