package service.sms;

import atomdance.app.BackendApplication;
import atomdance.app.config.SmsRestApiClientTestConfig;
import atomdance.app.service.sms.ScheduledSmsService;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.client.MockRestServiceServer;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest(classes = {
        BackendApplication.class
})
@ActiveProfiles("test")
@Import({SmsRestApiClientTestConfig.class, ScheduledSmsServiceTest.LoggerConfig.class})
class ScheduledSmsServiceTest {

    private static ListAppender<ILoggingEvent> listAppender;

    @Autowired
    @Qualifier("mockRestServiceServerForJustSend")
    MockRestServiceServer mockRestServiceServer;

    @Test
    void shouldDoSomething() {
        assertThat("true").isNotBlank();
    }

    @TestConfiguration
    static class LoggerConfig {
        @Bean
        static BeanFactoryPostProcessor setupLogger() {
            return beanFactory -> {
               ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
               listAppender.start();

                Logger logger = (Logger) LoggerFactory.getLogger(ScheduledSmsService.class);
                logger.setLevel(Level.DEBUG);
                logger.setAdditive(false);
                logger.addAppender(listAppender);
            };
        }
    }
}
