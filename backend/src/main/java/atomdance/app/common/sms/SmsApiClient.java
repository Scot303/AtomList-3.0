package atomdance.app.common.sms;

import atomdance.json.justsend.BulkSendRequest;
import atomdance.json.justsend.SingleSendRequest;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange(value = "/sender", contentType = "application/json", accept = "application/json")
public interface SmsApiClient {

    @PostExchange("/bulk/send")
    void bulkSendMessage(@RequestBody BulkSendRequest bulkSendRequest);

    @PostExchange("/singlemessage/send")
    void singleSendMessage(@RequestBody SingleSendRequest singleSendRequest);
}
