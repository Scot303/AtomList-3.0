package atomdance.app.modules.user.service;

import atomdance.app.common.mail.AuthMailer;
import atomdance.app.config.LoginPolicyProperties;
import atomdance.app.modules.user.exception.AccountInactiveException;
import atomdance.app.modules.user.exception.AccountLockedException;
import atomdance.app.modules.user.exception.EmailNotVerifiedException;
import atomdance.app.modules.user.exception.InvalidLoginCodeException;
import atomdance.app.modules.user.model.LoginCode;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.LoginCodeRepository;
import atomdance.app.modules.user.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * Issues and redeems the one-time codes that stand in for passwords.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LoginCodeService {

	private final LoginCodeRepository repository;
	private final UserRepository userRepository;
	private final EmailVerificationService emailVerificationService;
	private final AccountLockService accountLockService;
	private final LoginCodeGenerator generator;
	private final LoginPolicyProperties policy;
	private final PasswordEncoder passwordEncoder;
	private final AuthMailer mailer;

	/**
	 * A throwaway hash that no code will ever match, compared against on the paths where there is
	 * nothing real to compare against.
	 */
	private String decoyHash;

	@PostConstruct
	void prepareDecoyHash() {
		decoyHash = passwordEncoder.encode(UUID.randomUUID().toString());
	}

	/**
	 * Emails a code, or quietly does nothing.
	 * Every outcome looks identical from outside: unknown identifier, deactivated account, locked
	 * account, unverified address, and "you already asked a moment ago" all return without a word.
	 * The endpoint above answers {@code 202} regardless, and because delivery is asynchronous the
	 * response takes the same time in each case, so neither the body nor the clock says whether the
	 * account exists.
	 */
	@Transactional
	public void requestCode(String identifier) {
		Instant now = Instant.now();
		Optional<User> found = userRepository.findByUsernameOrEmailWithPermissions(normalizeIdentifier(identifier));

		if (found.isEmpty()) {
			log.debug("Ignoring a login-code request for an unknown identifier");
			return;
		}

		User user = found.get();

		if (!user.isActive()) {
			log.debug("Ignoring a login-code request for deactivated account {}", user.getId());
			return;
		}

		if (user.isLockedAt(now)) {
			log.debug("Ignoring a login-code request for locked account {}", user.getId());
			return;
		}

		if (!user.isEmailVerified()) {
			log.info("Account {} asked for a login code but its address is unverified - re-sending the verification link", user.getId());

			emailVerificationService.issueIfOutsideCooldown(user);
			return;
		}

		Optional<Instant> lastIssued = repository.findLastIssuedAt(user.getId());

		if (lastIssued.isPresent() && lastIssued.get().plus(policy.getCode().getResendCooldown()).isAfter(now)) {
			log.debug("Suppressing a login code for account {} - still inside the resend cooldown", user.getId());
			return;
		}

		issueCode(user, now);
	}

	/**
	 * Redeems a code and hands back the account it belongs to.
	 */
	@Transactional(noRollbackFor = {InvalidLoginCodeException.class, AccountLockedException.class, AccountInactiveException.class, EmailNotVerifiedException.class})
	public User verifyCode(String identifier, String submittedCode) {
		Instant now = Instant.now();
		String code = LoginCodeGenerator.normalize(submittedCode);

		Optional<User> found = userRepository.findByUsernameOrEmailWithPermissions(normalizeIdentifier(identifier));

		if (found.isEmpty()) {
			wasteTimeMatching(code);
			throw new InvalidLoginCodeException();
		}

		User user = found.get();

		accountLockService.assertNotLocked(user, now);

		Optional<LoginCode> outstanding = repository.findNewestUsable(user.getId(), now);

		// No live code, so nothing was actually guessed at. Deliberately not counted as a failure.
		if (outstanding.isEmpty()) {
			wasteTimeMatching(code);
			throw new InvalidLoginCodeException();
		}

		LoginCode loginCode = outstanding.get();

		if (loginCode.getAttempts() >= policy.getCode().getMaxAttempts()) {
			loginCode.setConsumedAt(now);
			wasteTimeMatching(code);

			throw new InvalidLoginCodeException();
		}

		if (!passwordEncoder.matches(code, loginCode.getCodeHash())) {
			loginCode.setAttempts(loginCode.getAttempts() + 1);

			if (loginCode.getAttempts() >= policy.getCode().getMaxAttempts()) {
				loginCode.setConsumedAt(now);
			}

			accountLockService.recordFailure(user, now);

			throw new InvalidLoginCodeException();
		}

		// Correct. Spend this code and any other still outstanding, so a second window left open on another device cannot be used behind the user's back.
		repository.consumeAllForUser(user.getId(), now);

		// Checked only now, after possession has been proved. Any earlier and the endpoint would report the state of accounts to callers who have shown no claim to them.
		if (!user.isActive()) {
			throw new AccountInactiveException();
		}

		if (!user.isEmailVerified()) {
			throw new EmailNotVerifiedException();
		}

		accountLockService.reset(user);
		user.setLastLoginAt(now);

		return user;
	}

	@Scheduled(cron = "0 20 3 * * *", zone = "${app.time-zone}")
	@Transactional
	public void purgeExpiredCodes() {
		int deleted = repository.deleteExpiredBefore(Instant.now());

		if (deleted > 0) {
			log.info("Purged {} expired login code(s)", deleted);
		}
	}

	private void issueCode(User user, Instant now) {
		repository.consumeAllForUser(user.getId(), now);

		String code = generator.generate(policy.getCode().getLength());

		repository.save(LoginCode.builder()
				.codeHash(passwordEncoder.encode(code))
				.user(user)
				.createdAt(now)
				.expiresAt(now.plus(policy.getCode().getTtl()))
				.build());

		mailer.sendLoginCode(
				user.getEmail(),
				user.getUsername(),
				generator.forDisplay(code),
				policy.getCode().getTtl().toMinutes(),
				LocaleContextHolder.getLocale()
		);

		log.info("Issued a login code for account {}", user.getId());
	}

	private void wasteTimeMatching(String code) {
		passwordEncoder.matches(code, decoyHash);
	}

	public static String normalizeIdentifier(String identifier) {
		return identifier == null ? "" : identifier.trim().toLowerCase(Locale.ROOT);
	}
}
