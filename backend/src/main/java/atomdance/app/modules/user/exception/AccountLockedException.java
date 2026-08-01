package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class AccountLockedException extends BaseException {

	public AccountLockedException(long minutesRemaining) {
		super(
				"error.account_locked",
				new Object[]{minutesRemaining},
				"ACCOUNT_LOCKED_423",
				HttpStatus.LOCKED
		);
	}
}
