package atomdance.app.common.exception;

public class JustSendApiClientException extends RuntimeException {
    public JustSendApiClientException(Throwable cause) {
        super("Exception while calling JustSend API", cause);
    }
}
