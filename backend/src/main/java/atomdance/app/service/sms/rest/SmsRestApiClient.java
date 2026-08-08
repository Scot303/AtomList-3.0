package atomdance.app.service.sms.rest;

import atomdance.json.justsend.BulkSendRequest;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange(contentType = "application/json", accept = "application/json")
public interface SmsRestApiClient {

    //TODO response schemas?

    @PostExchange("/sender/bulk/send")
    void bulkSendMessage(BulkSendRequest bulkSendRequest);

}