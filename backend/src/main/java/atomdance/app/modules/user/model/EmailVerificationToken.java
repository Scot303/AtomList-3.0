package atomdance.app.modules.user.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Proves that the address on an account really belongs to whoever holds the account.
 */
@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "email_verification_tokens",
		indexes = {@Index(name = "idx_email_verification_tokens_user_id", columnList = "user_id"), @Index(name = "idx_email_verification_tokens_expires_at", columnList = "expiresAt")
})
public class EmailVerificationToken {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "token_hash", nullable = false, unique = true, length = 64)
	private String tokenHash;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/**
	 * The address this link was mailed to, as it stood at the time.
	 */
	@Column(nullable = false, length = 255)
	private String email;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant expiresAt;

	private Instant consumedAt;

	public boolean isUsable(Instant now) {
		return consumedAt == null && expiresAt.isAfter(now);
	}
}
