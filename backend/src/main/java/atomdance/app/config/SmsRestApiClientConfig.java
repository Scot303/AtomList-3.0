package atomdance.app.config;

import atomdance.app.common.sms.LoggingSmsApiClient;
import atomdance.app.common.sms.SmsApiClient;
import jakarta.annotation.Nullable;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
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
    @ConditionalOnExpression("T(org.springframework.util.StringUtils).hasText('${app.sms.rest.justSend.apiKey}')")
    public RestClient.Builder smsRestApiClientBuilder() {
        return RestClient.builder()
                .baseUrl(justSendUrl)
                .defaultHeader("App-Key", justSendApiKey);
    }


    @Bean
    SmsApiClient justSendSmsRestApi(@Nullable @Qualifier("smsRestApiClientBuilder") RestClient.Builder smsRestApiClientBuilder) {
        if (smsRestApiClientBuilder == null) {
            return new LoggingSmsApiClient();
        }
        var serviceProxy = HttpServiceProxyFactory.
                builderFor(RestClientAdapter.create(smsRestApiClientBuilder.build()))
                .build();

        return serviceProxy.createClient(SmsApiClient.class);
    }
}
