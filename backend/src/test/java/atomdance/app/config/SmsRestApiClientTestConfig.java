package atomdance.app.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.test.web.client.match.MockRestRequestMatchers;
import org.springframework.test.web.client.response.MockRestResponseCreators;
import org.springframework.web.client.RestClient;

import java.net.URI;

@TestConfiguration
public class SmsRestApiClientTestConfig {

    @Value("${app.sms.rest.justSend.apiKey}")
    private String justSendApiKey;

    @Value("${app.sms.rest.justSend.url}")
    private String justSendUrl;

    @Autowired
    RestClient.Builder smsRestApiClientBuilder;

    @Bean
    @Qualifier("mockRestServiceServerForJustSend")
    MockRestServiceServer mockRestServiceServer() {
        MockRestServiceServer mockRestServiceServer = MockRestServiceServer
                .bindTo(smsRestApiClientBuilder)
                .bufferContent()
                .build();

        mockRestServiceServer
                .expect(ExpectedCount.min(1), MockRestRequestMatchers.requestTo(justSendUrl))
                .andExpect(MockRestRequestMatchers.method(HttpMethod.POST))
                .andExpect(MockRestRequestMatchers.header("App-Key", justSendApiKey))
                .andExpect(MockRestRequestMatchers.header("Content-Type", "application/json"))
                .andRespond(MockRestResponseCreators.withCreatedEntity(URI.create("SOMETHING")));

        return mockRestServiceServer;
    }
}
