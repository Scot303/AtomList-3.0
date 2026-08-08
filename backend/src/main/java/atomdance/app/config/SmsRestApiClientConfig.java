package atomdance.app.config;

import atomdance.app.service.sms.rest.SmsRestApiClient;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class SmsRestApiClientConfig {

    @Value("${app.sms.rest.justSend.apiKey}")
    private String justSendApiKey;

    @Value("${app.sms.rest.justSend.url}")
    private String justSendUrl;


    @Bean
    public RestClient.Builder smsRestApiClientBuilder() {
        return RestClient.builder()
                .baseUrl(justSendUrl)
                .defaultHeader("App-Key", justSendApiKey);
    }


    @Bean
    SmsRestApiClient justSendSmsRestApi(@Qualifier("smsRestApiClientBuilder") RestClient.Builder smsRestApiClientBuilder) {
        var serviceProxy = HttpServiceProxyFactory.
                builderFor(RestClientAdapter.create(smsRestApiClientBuilder.build()))
                .build();

        return serviceProxy.createClient(SmsRestApiClient.class);
    }
}
