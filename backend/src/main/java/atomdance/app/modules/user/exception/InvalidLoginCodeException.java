package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class InvalidLoginCodeException extends BaseException {

	public InvalidLoginCodeException() {
		super(
				"error.invalid_login_code",
				null,
				"INVALID_LOGIN_CODE_401",
				HttpStatus.UNAUTHORIZED
		);
	}
}
