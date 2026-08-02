package atomdance.app.modules.user.service;

import atomdance.app.config.LoginPolicyProperties;
import atomdance.app.modules.user.exception.AccountLockedException;
import atomdance.app.modules.user.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

/**
 * Temporary sign-in lockouts, kept apart from deactivation on purpose.
 * A lockout expires by itself, an administrator can end it early, and - unlike deactivation - it has
 * no effect on sessions that are already established. That last part matters: if a lockout killed
 * live sessions, anyone could sign a legitimate user out of their work simply by typing their
 * username and guessing wrong a few times.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccountLockService {

	private final LoginPolicyProperties policy;

	public void assertNotLocked(User user, Instant now) {
		if (!user.isLockedAt(now)) {
			return;
		}

		long minutes = Math.max(1, Duration.between(now, user.getLockedUntil()).toMinutes());

		throw new AccountLockedException(minutes);
	}

	/**
	 * Counts one failed sign-in and locks the account once the threshold is crossed.
	 */
	public void recordFailure(User user, Instant now) {
		int failures = user.getFailedLoginAttempts() + 1;

		if (failures < policy.getLockout().getMaxFailedAttempts()) {
			user.setFailedLoginAttempts(failures);
			return;
		}

		user.setFailedLoginAttempts(0);
		user.setLockedUntil(now.plus(policy.getLockout().getDuration()));

		log.warn("Locked account {} until {} after {} failed sign-in attempts", user.getId(), user.getLockedUntil(), failures);
	}

	/**
	 * Clears both halves of the state. Called on a successful sign-in and by an administrator unlocking somebody.
	 */
	public void reset(User user) {
		user.setFailedLoginAttempts(0);
		user.setLockedUntil(null);
	}
}
