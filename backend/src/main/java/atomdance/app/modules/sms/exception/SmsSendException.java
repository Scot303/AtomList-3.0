package atomdance.app.modules.sms.exception;

import atomdance.app.common.exception.BaseException;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;

public class SmsSendException extends BaseException {

    public SmsSendException(String entityKey) {
        super(
                "error.sending_sms_failed",
                new Object[]{new DefaultMessageSourceResolvable(entityKey)},
                "",
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
