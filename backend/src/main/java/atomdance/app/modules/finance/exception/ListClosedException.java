package atomdance.app.modules.finance.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.http.HttpStatus;

/**
 * A closed list has been sent to the accountants, and its figures are final.
 */
public class ListClosedException extends BaseException {

	public ListClosedException() {
		super("error.list_closed", null, "LIST_CLOSED", HttpStatus.CONFLICT);
	}
}
