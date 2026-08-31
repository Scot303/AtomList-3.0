package atomdance.app.modules.user.service;

import atomdance.app.common.mail.AuthMailer;
import atomdance.app.common.mail.MailProperties;
import atomdance.app.common.utils.OpaqueTokens;
import atomdance.app.config.LoginPolicyProperties;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.user.exception.InvalidVerificationTokenException;
import atomdance.app.modules.user.model.EmailVerificationToken;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.EmailVerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.event.Level;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;


/**
 * Proves that the address on an account belongs to whoever holds the account.
 */
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

	private final EmailVerificationTokenRepository repository;
	private final LoginPolicyProperties policy;
	private final MailProperties mailProperties;
	private final AuthMailer mailer;
	private final AuditLogger auditLogger;


	/**
	 * Sends a fresh link, ignoring the resend cooldown.
	 */
	@Transactional
	public void issue(User user) {
		issue(user, Instant.now());
	}


	/**
	 * Sends a link only if the last one is old enough.
	 */
	@Transactional
	public boolean issueIfOutsideCooldown(User user) {
		Instant now = Instant.now();
		Optional<Instant> lastIssued = repository.findLastIssuedAt(user.getId());

		if (lastIssued.isPresent() && lastIssued.get().plus(policy.getEmailVerification().getResendCooldown()).isAfter(now)) {
			auditLogger.systemFailure(Level.DEBUG, AuditEventType.EMAIL_VERIFICATION, user.getId(), "Suppressing verification mail for user, still inside the resend cooldown.");
			return false;
		}

		issue(user, now);

		return true;
	}


	/**
	 * Consumes a link and marks the address verified.
	 */
	@Transactional
	public User verify(String rawToken) {
		if (rawToken == null || rawToken.isBlank()) {
			throw new InvalidVerificationTokenException();
		}

		Instant now = Instant.now();

		EmailVerificationToken token = repository.findByTokenHashWithUser(OpaqueTokens.hash(rawToken))
				.orElseThrow(InvalidVerificationTokenException::new);

		if (!token.isUsable(now)) {
			throw new InvalidVerificationTokenException();
		}

		User user = token.getUser();

		if (!token.getEmail().equals(user.getEmail())) {
			auditLogger.systemFailure(Level.WARN, AuditEventType.EMAIL_VERIFICATION, user.getId(), "Refusing a verification link for user, it was issued for an address that has since changed.");

			throw new InvalidVerificationTokenException();
		}

		repository.consumeAllForUser(user.getId(), now);
		user.setEmailVerified(true);

		auditLogger.systemSuccess(AuditEventType.EMAIL_VERIFICATION, user.getId(), "Verified the email address on account.");

		return user;
	}


	/**
	 * Consumed and expired rows are only worth keeping until they expire.
	 */
	@Scheduled(cron = "0 25 2 * * *", zone = "UTC")
	@Transactional
	public void purgeExpiredTokens() {
		int deleted = repository.deleteExpiredBefore(Instant.now());

		if (deleted > 0) {
			auditLogger.systemSuccess(AuditEventType.SYSTEM_CLEANUP, null, "Purged %d expired email-verification token(s).", deleted);
		}
	}


	private void issue(User user, Instant now) {
		repository.consumeAllForUser(user.getId(), now);

		String rawToken = OpaqueTokens.generate();

		repository.save(EmailVerificationToken.builder()
				.tokenHash(OpaqueTokens.hash(rawToken))
				.user(user)
				.email(user.getEmail())
				.createdAt(now)
				.expiresAt(now.plus(policy.getEmailVerification().getTtl()))
				.build());

		mailer.sendEmailVerification(
				user.getEmail(),
				user.getUsername(),
				mailProperties.buildVerificationUrl(rawToken),
				policy.getEmailVerification().getTtl().toHours(),
				LocaleContextHolder.getLocale()
		);
	}
}
