package atomdance.app.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class BaseException extends RuntimeException {
	private final String messageKey;
	private final Object[] args;
	private final String errorCode;
	private final HttpStatus status;

	protected BaseException(String messageKey, Object[] args, String errorCode, HttpStatus status) {
		super(messageKey);
		this.messageKey = messageKey;
		this.args = args;
		this.errorCode = errorCode;
		this.status = status;
	}
}