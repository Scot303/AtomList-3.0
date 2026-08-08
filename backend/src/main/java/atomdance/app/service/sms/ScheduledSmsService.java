package atomdance.app.service.sms;

import atomdance.app.common.utils.AppClock;
import atomdance.app.service.sms.rest.SmsRestApiClient;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.sms.model.Sms;
import atomdance.app.modules.sms.service.SmsService;
import atomdance.json.justsend.BulkSendRequest;
import atomdance.json.justsend.RestRecipient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@ConditionalOnProperty(value = "app.sms.schedule.reminder.enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class ScheduledSmsService {
    private final AppClock appClock;
    private final SmsService smsService;
    private final PaymentListRepository paymentListRepository;
    private final PaymentRepository paymentRepository;
    private final SmsRestApiClient smsRestApiClient;
    private final AuditLogger auditLogger;

    // TODO templates in English?
    private static final String STANDARD_TEMPLATE = "Przypominamy o uregulowaniu płatności za zajęcia: %s zł.";

    @Scheduled(cron = "0 0 13 15 * *", zone = "${app.time-zone}")
    protected void bla() {
        var currentYearMonth = appClock.currentYearMonth();

        var owedPayments = getOwedPayments(currentYearMonth);
        Map<PersonToSend, BigDecimal> combinedOwedPayments = pairPhoneNumbersWithOwedPayments(owedPayments);
        List<Sms> messagesToSend = createMessagesToDebtors(combinedOwedPayments);

        var recipients = messagesToSend.stream().map(sms -> new RestRecipient(sms.getSentToPhone(), sms.getMessage())).toList();
        var bulkSendRequest = getBulkSendRequest().withRecipients(recipients);

        try {
            smsRestApiClient.bulkSendMessage(bulkSendRequest);
        } catch (HttpStatusCodeException e) {
            String errorMsg = "JustSend API returned %s: %s".formatted(e.getStatusCode(), e.getStatusText());
            log.error(errorMsg);
            auditLogger.record(null, AuditEventType.SMS_SEND, AuditOutcome.FAILURE, errorMsg);
            return;
        }

        smsService.saveSentScheduledSms(messagesToSend);
    }

    private List<Payment> getOwedPayments(YearMonth currentYearMonth) {
        return ListType.standardTypes().stream()
                .flatMap(type -> getPaymentList(currentYearMonth, type).stream())
                .flatMap(list -> paymentRepository.findUnpaidByListId(list.getId()).stream())
                .toList();
    }

    private Map<PersonToSend, BigDecimal> pairPhoneNumbersWithOwedPayments(List<Payment> owedPayments) {
        Map<PersonToSend, BigDecimal> combinedOwedPayments = new HashMap<>();
        owedPayments.forEach(payment -> combinedOwedPayments.merge(PersonToSend.of(payment), payment.getAmountToPay(), BigDecimal::add));
        return combinedOwedPayments;
    }

    private List<Sms> createMessagesToDebtors(Map<PersonToSend, BigDecimal> combinedOwedPayments) {
        return new ArrayList<>(combinedOwedPayments.entrySet().stream()
                .map(entry -> new Sms(entry.getKey().person, STANDARD_TEMPLATE.formatted(entry.getValue().toString())))
                .toList());
    }

    private Optional<PaymentList> getPaymentList(YearMonth yearMonth, ListType type) {
        return paymentListRepository.findByYearAndMonthAndType(yearMonth.getYear(), yearMonth.getMonthValue(), type);
    }

    protected record PersonToSend(Person person, String effectivePhoneNumber) {
        static PersonToSend of(Payment payment){
            return new PersonToSend(payment.getPerson(), payment.getPerson().getEffectivePhone());
        }
    }

    private BulkSendRequest getBulkSendRequest() {
        return new BulkSendRequest()
                .withName("AtomDance:" + appClock.today().format(DateTimeFormatter.BASIC_ISO_DATE))
                .withBulkType(BulkSendRequest.BulkType.PERSONALIZED)
                .withBulkVariant(BulkSendRequest.BulkVariant.PRO)
                .withSender("Atom Dance")
                .withSendDate(appClock.nowOffset().plusMinutes(10L));
    }

}
