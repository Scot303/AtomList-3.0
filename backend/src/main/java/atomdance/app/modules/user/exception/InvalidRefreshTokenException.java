package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class InvalidRefreshTokenException extends BaseException {

	public InvalidRefreshTokenException() {
		super(
				"error.invalid_refresh_token",
				null,
				"REFRESH_TOKEN_401",
				HttpStatus.UNAUTHORIZED
		);
	}
}