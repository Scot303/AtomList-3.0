package atomdance.app.modules.sms;

import atomdance.app.BackendApplication;
import atomdance.app.common.utils.AppClock;
import atomdance.app.config.SmsRestApiClientTestConfig;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.sms.service.SmsService;
import atomdance.app.modules.sms.service.ScheduledSmsService;
import atomdance.app.common.sms.SmsApiClient;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.support.RestClientAdapter;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SpringBootTest(classes = {
        BackendApplication.class
})
@ActiveProfiles("test")
@Import({SmsRestApiClientTestConfig.class, ScheduledSmsServiceSpringTest.LoggerConfig.class})
class ScheduledSmsServiceSpringTest {

    @Autowired private AppClock appClock;
    @MockitoBean private SmsService smsService = mock(SmsService.class);
    @MockitoBean private PaymentListRepository paymentListRepository = mock(PaymentListRepository.class);
    @MockitoBean private PaymentRepository paymentRepository = mock(PaymentRepository.class);
    @Autowired private AuditLogger auditLogger;
    @Autowired private List<String> phoneWhitelist;
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

        SmsApiClient testJustSendSmsRestApi = serviceProxy.createClient(SmsApiClient.class);
        // some payment data is needed, otherwise service exits early
        when(paymentListRepository.findByYearAndMonthAndType(anyInt(), anyInt(), any(ListType.class)))
                .thenReturn(mockPaymentList());
        when(paymentRepository.findUnpaidByListId(any(UUID.class))).thenReturn(mockUnpaidPayment());

        scheduledSmsService = new ScheduledSmsService(appClock, smsService, paymentListRepository, paymentRepository, testJustSendSmsRestApi, auditLogger, phoneWhitelist);
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

    private static List<Payment> mockUnpaidPayment() {
        return List.of(Payment.builder()
                .amountToPay(BigDecimal.valueOf(50.50))
                .person(Person.builder()
                        .id(UUID.randomUUID())
                        .phone(null)
                        .family(Family.builder()
                                .phone("123456789")
                                .build())
                        .build())
                .build());
    }

    private static Optional<PaymentList> mockPaymentList() {
        return Optional.of(PaymentList.builder()
                .id(UUID.randomUUID()).build());
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
