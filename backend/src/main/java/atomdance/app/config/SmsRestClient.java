package atomdance.app.config;

import atomdance.json.justsend.BulkSendRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange(contentType = "application/json", accept = "application/json")
public interface SmsRestClient {

    //TODO response schemas?

    @PostExchange("/sender/bulk/send")
    ResponseEntity<String> bulkSendMessage(BulkSendRequest bulkSendRequest);

}