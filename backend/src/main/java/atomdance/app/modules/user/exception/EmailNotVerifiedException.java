package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class EmailNotVerifiedException extends BaseException {

	public EmailNotVerifiedException() {
		super(
				"error.email_not_verified",
				null,
				"EMAIL_NOT_VERIFIED_403",
				HttpStatus.FORBIDDEN
		);
	}
}
