package atomdance.app.modules.sms;

import atomdance.app.BackendApplication;
import atomdance.app.common.sms.LoggingSmsApiClient;
import atomdance.app.common.sms.SmsApiClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(classes = { BackendApplication.class }, properties = { "app.sms.rest.justSend.apiKey= " })
@ActiveProfiles("test")
class LoggingSmsApiClientTest {

    @Autowired
    private ApplicationContext context;

    @Test
    void smsApiClientShouldBeLoggingSmsApiClient() {
        SmsApiClient bean = context.getBean(SmsApiClient.class);
        assertEquals(LoggingSmsApiClient.class, bean.getClass());
    }
}
