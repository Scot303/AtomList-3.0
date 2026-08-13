package atomdance.app.common.sms;

import atomdance.json.justsend.BulkSendRequest;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.event.Level;

@Slf4j
public class LoggingSmsApiClient implements SmsApiClient {

    @Override
    public void bulkSendMessage(BulkSendRequest bulkSendRequest) {
        log.warn("Api Key missing - Using fallback console logger instead of calling JustSend API");
        log.atLevel(Level.WARN)
            .addKeyValue("bulkType", bulkSendRequest.getBulkType())
            .addKeyValue("bulkVariant", bulkSendRequest.getBulkVariant())
            .addKeyValue("sender", bulkSendRequest.getSender())
            .log();

        for (var recipient : bulkSendRequest.getRecipients()) {
            log.warn("recipient number: {}, message content: {}", recipient.getMsisdn(), recipient.getContent());
        }
    }
}
