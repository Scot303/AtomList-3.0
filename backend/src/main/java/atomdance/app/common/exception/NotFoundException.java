package atomdance.app.common.exception;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;

public class NotFoundException extends BaseException {

	public NotFoundException(String entityKey) {
		super(
				"error.not_found_template",
				new Object[]{new DefaultMessageSourceResolvable(entityKey)},
				"RECORD_NOT_FOUND_ERROR",
				HttpStatus.NOT_FOUND
		);
	}
}