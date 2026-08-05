package atomdance.app.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(value = "app.sms.schedule.reminder.enabled", havingValue = "true")
public class PaymentReminder {

    @Scheduled(cron = "0 0 13 15 * *", zone = "${app.time-zone}")
    private void bla() {
        //TODO implement
    }
}
