package atomdance.app.common.exception;

import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;

public class NameTakenException extends BaseException {

	public NameTakenException(String entityKey) {
		super(
				"error.name_taken_template",
				new Object[]{new DefaultMessageSourceResolvable(entityKey)},
				"RECORD_WITH_SIMILAR_NAME_EXISTS",
				HttpStatus.BAD_REQUEST
		);
	}
}