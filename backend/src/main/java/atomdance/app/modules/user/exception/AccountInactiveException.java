package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class AccountInactiveException extends BaseException {

	public AccountInactiveException() {
		super(
				"error.account_inactive",
				null,
				"ACCOUNT_INACTIVE_403",
				HttpStatus.FORBIDDEN
		);
	}
}
