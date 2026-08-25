package atomdance.app.modules.user.service;

import atomdance.app.common.utils.OpaqueTokens;
import atomdance.app.modules.user.exception.InvalidRefreshTokenException;
import atomdance.app.modules.user.model.RefreshToken;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.RefreshTokenRepository;
import atomdance.app.modules.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;


@Slf4j
@Service
public class RefreshTokenService {

	private final RefreshTokenRepository repository;
	private final UserRepository userRepository;
	private final Duration ttl;


	public RefreshTokenService(RefreshTokenRepository repository, UserRepository userRepository, @Value("${app.security.refresh-token-ttl}") Duration ttl) {
		this.repository = repository;
		this.userRepository = userRepository;
		this.ttl = ttl;
	}


	/**
	 * Mints a new refresh token and returns the raw value. This is the only moment the raw value exists server-side - only its hash is persisted.
	 * The caller puts it in an {@code HttpOnly} cookie; it must never reach a response body.
	 */
	@Transactional
	public String issue(User user) {
		String token = OpaqueTokens.generate();
		Instant now = Instant.now();

		repository.save(RefreshToken.builder()
				.tokenHash(OpaqueTokens.hash(token))
				.user(user)
				.createdAt(now)
				.expiresAt(now.plus(ttl))
				.build());

		return token;
	}


	/**
	 * Validates a presented token and spends it, returning the owning user so the caller can mint a replacement pair.
	 * The token is single-use: presenting it twice is treated as a breach.
	 */
	@Transactional(noRollbackFor = InvalidRefreshTokenException.class)
	public User consume(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			throw new InvalidRefreshTokenException();
		}

		RefreshToken stored = repository.findByTokenHashWithUser(OpaqueTokens.hash(rawToken))
				.orElseThrow(InvalidRefreshTokenException::new);

		Instant now = Instant.now();

		// Already spent. Either the client replayed an old token or someone stole one, and we are racing the legitimate owner.
		// There is no way to tell them apart, so assume the worst and end every session this user has.
		if (stored.getRevokedAt() != null) {
			log.warn("Refresh token reuse detected for user id {} - revoking all of their sessions", stored.getUser().getId());

			killAllSessions(stored.getUser().getId(), now);
			throw new InvalidRefreshTokenException();
		}

		if (!stored.getExpiresAt().isAfter(now)) {
			throw new InvalidRefreshTokenException();
		}

		// Rotation: this token is now spent. The caller issues its replacement.
		stored.setRevokedAt(now);

		return stored.getUser();
	}


	/**
	 * Ends one session. Deliberately silent when the token is unknown - reporting the difference
	 * would turn logout into an oracle for guessing valid tokens.
	 */
	@Transactional
	public void revoke(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			return;
		}

		repository.findByTokenHash(OpaqueTokens.hash(rawToken))
				.filter(token -> token.getRevokedAt() == null)
				.ifPresent(token -> token.setRevokedAt(Instant.now()));
	}


	/**
	 * Ends every session a user has, on both halves: revoking the refresh tokens stops new access
	 * tokens being minted, and bumping the token version invalidates the access tokens already out
	 * there. Skipping the bump would leave a stolen access token usable until it expires on its own.
	 */
	@Transactional
	public void revokeAllForUser(UUID userId) {
		killAllSessions(userId, Instant.now());
	}


	/**
	 * The bulk update writes straight to the database, so any {@link User} already loaded in the
	 * current persistence context keeps its stale {@code tokenVersion}.
	 * Nothing may re-read or re-save that instance afterwards, or the bump would be silently undone.
	 */
	private void killAllSessions(UUID userId, Instant now) {
		int revoked = repository.revokeAllForUser(userId, now);
		userRepository.bumpTokenVersion(userId);

		log.info("Revoked {} refresh token(s) and bumped the token version for user id {}", revoked, userId);
	}


	/**
	 * Revoked rows are kept until they expire, so reuse detection still has something to match against.
	 */
	@Scheduled(cron = "0 15 2 * * *", zone = "UTC")
	@Transactional
	public void purgeExpiredTokens() {
		int deleted = repository.deleteExpiredBefore(Instant.now());

		if (deleted > 0) {
			log.info("Purged {} expired refresh token(s)", deleted);
		}
	}
}
