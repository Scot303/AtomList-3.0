package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class InvalidVerificationTokenException extends BaseException {

	public InvalidVerificationTokenException() {
		super(
				"error.invalid_verification_token",
				null,
				"INVALID_VERIFICATION_TOKEN_400",
				HttpStatus.BAD_REQUEST
		);
	}
}
