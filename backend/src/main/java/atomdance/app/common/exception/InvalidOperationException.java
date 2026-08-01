package atomdance.app.common.exception;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;

public class InvalidOperationException extends BaseException {

	public InvalidOperationException(String message) {
		super(
				"error.invalid_operation_template",
				new Object[]{new DefaultMessageSourceResolvable(message)},
				"INVALID_OPERATION",
				HttpStatus.BAD_REQUEST
		);
	}
}