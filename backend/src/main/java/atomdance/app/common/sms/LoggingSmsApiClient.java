package atomdance.app.common.sms;

import atomdance.json.justsend.BulkSendRequest;
import atomdance.json.justsend.SingleSendRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.event.Level;

@Slf4j
public class LoggingSmsApiClient implements SmsApiClient {

    @Override
    public void bulkSendMessage(BulkSendRequest bulkSendRequest) {
        logWarning();
        log.atLevel(Level.WARN)
            .addKeyValue("bulkType", bulkSendRequest.getBulkType())
            .addKeyValue("bulkVariant", bulkSendRequest.getBulkVariant())
            .addKeyValue("sender", bulkSendRequest.getSender())
            .log();

        for (var recipient : bulkSendRequest.getRecipients()) {
            logRecipient(recipient.getMsisdn(), recipient.getContent());
        }
    }

    @Override
    public void singleSendMessage(SingleSendRequest singleSendRequest) {
        logWarning();
        log.atLevel(Level.WARN)
            .addKeyValue("bulkVariant", singleSendRequest.getBulkVariant())
            .addKeyValue("sender", singleSendRequest.getSender())
            .log();

        logRecipient(singleSendRequest.getMsisdn(), singleSendRequest.getContent());
    }

    private void logWarning() {
        log.warn("Api Key missing - Using fallback console logger instead of calling JustSend API");
    }

    private void logRecipient(String msisdn, String content) {
        log.warn("recipient number: {}, message content: {}", msisdn, content);
    }
}
