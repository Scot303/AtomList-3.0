package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class UserNotAuthenticatedException extends BaseException {

	public UserNotAuthenticatedException() {
		super(
				"error.user_not_authenticated",
				null,
				"USER_401",
				HttpStatus.UNAUTHORIZED
		);
	}
}