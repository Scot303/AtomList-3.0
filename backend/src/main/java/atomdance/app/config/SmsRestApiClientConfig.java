package atomdance.app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration
public class SmsRestApiClientConfig {

    @Value("${app.rest.justSendApiKey}")
    private String justSendApiKey;


    @Bean
    SmsRestApiClient justSendSmsRestApi() {
        var restClient = RestClient.builder()
                .baseUrl("https://justsend.io/api/")
                .defaultHeader("App-Key", justSendApiKey)
                .build();

        var serviceProxy = HttpServiceProxyFactory.
                builderFor(RestClientAdapter.create(restClient))
                .build();

        return serviceProxy.createClient(SmsRestApiClient.class);
    }
}
