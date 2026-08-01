package atomdance.app.modules.user.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class UserNotFoundException extends BaseException {

	public UserNotFoundException(String identifier) {
		super(
				"error.username_not_found",
				new Object[]{identifier},
				"USERNAME_NOT_FOUND_ERROR",
				HttpStatus.NOT_FOUND
		);
	}
}