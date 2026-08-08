package service.sms;

import atomdance.app.BackendApplication;
import atomdance.app.common.utils.AppClock;
import atomdance.app.config.SmsRestApiClientTestConfig;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.sms.service.SmsService;
import atomdance.app.service.sms.ScheduledSmsService;
import atomdance.app.service.sms.rest.SmsRestApiClient;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(classes = {
        BackendApplication.class
})
@ActiveProfiles("test")
@Import({SmsRestApiClientTestConfig.class, ScheduledSmsServiceTest.LoggerConfig.class})
class ScheduledSmsServiceTest {
    @Value("${app.sms.rest.justSend.apiKey}")
    private String justSendApiKey;

    @Value("${app.sms.rest.justSend.url}")
    private String justSendUrl;

    @Autowired private AppClock appClock;
    @Autowired private SmsService smsService;
    @Autowired private PaymentListRepository paymentListRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private AuditLogger auditLogger;
    @Autowired private ListAppender<ILoggingEvent> listAppender;

    private ScheduledSmsService scheduledSmsService;

    @Autowired
    RestClient.Builder smsRestApiClientBuilder;

    @Autowired
    private MockRestServiceServer mockRestServiceServer;

    @BeforeEach
    void setup() {
        var serviceProxy = HttpServiceProxyFactory.
                builderFor(RestClientAdapter.create(smsRestApiClientBuilder.build()))
                .build();

        SmsRestApiClient testJustSendSmsRestApi = serviceProxy.createClient(SmsRestApiClient.class);
        scheduledSmsService = new ScheduledSmsService(appClock, smsService, paymentListRepository, paymentRepository, testJustSendSmsRestApi, auditLogger);
    }

    @Test
    void shouldRunScheduledMethod() {
        scheduledSmsService.scheduleSms();
        assertTrue(
                listAppender.list.stream()
                        .map(ILoggingEvent::getFormattedMessage)
                        .anyMatch(m -> m.contains("Running scheduled sms service for owed payments")));
    }

    @Test
    void scheduledServiceShouldSendRequest() {
        scheduledSmsService.scheduleSms();
        mockRestServiceServer.verify();
    }

    @TestConfiguration
    static class LoggerConfig {

        @Bean
        public ListAppender<ILoggingEvent> listAppender() {
            ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
            listAppender.start();

            return listAppender;
        }

        @Bean
        static BeanFactoryPostProcessor setupLogger(ListAppender<ILoggingEvent> listAppender) {
            return beanFactory -> {

                Logger logger = (Logger) LoggerFactory.getLogger(ScheduledSmsService.class);
                logger.setLevel(Level.DEBUG);
                logger.addAppender(listAppender);
            };
        }
    }
}
