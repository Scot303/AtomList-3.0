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
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
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

    @Scheduled(cron = "${app.sms.schedule.reminder.cron}", zone = "${app.time-zone}")
    public void scheduleSms() {
        log.info("Running scheduled sms service for owed payments");
        var currentYearMonth = appClock.currentYearMonth();

        var owedPayments = getOwedPayments(currentYearMonth);
        Map<String, SumOfOwedPaymentsInFamily> combinedOwedPayments = pairPhoneNumbersWithOwedPayments(owedPayments);
        List<Sms> messagesToSend = createMessagesToDebtors(combinedOwedPayments);

        var recipients = messagesToSend.stream().map(sms -> new RestRecipient(sms.getSentToPhone(), sms.getMessage())).toList();
        var bulkSendRequest = getBulkSendRequest().withRecipients(recipients);

        try {
            smsRestApiClient.bulkSendMessage(bulkSendRequest);
        } catch (HttpStatusCodeException e) {
            String errorMsg = "JustSend API returned %s: %s".formatted(e.getStatusCode(), e.getMessage());
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

    /**
     * <p>Pair Persons with outstanding payment and its amount with the phone number where alert should be sent (key).
     * </p>
     * One phone number may lead to a group of Persons (Family) ({@link SumOfOwedPaymentsInFamily}) with shared debt,
     * of which the family phone number will be notified.
     */
    private Map<String, SumOfOwedPaymentsInFamily> pairPhoneNumbersWithOwedPayments(List<Payment> owedPayments) {
        Map<String, SumOfOwedPaymentsInFamily> map = new HashMap<>();
        owedPayments.forEach(
                payment -> map.merge(
                        payment.getPerson().getEffectivePhone(),
                        new SumOfOwedPaymentsInFamily(new ArrayList<>(Arrays.asList(payment.getPerson())), payment.getAmountToPay()),
                        (currentSumInFamily, newMember) -> {
                            List<Person> currentList = currentSumInFamily.persons;
                            currentList.add(newMember.persons.getFirst());

                            BigDecimal currentOwnedSum = currentSumInFamily.owedPayment;
                            BigDecimal increasedSum = currentOwnedSum.add(newMember.owedPayment);
                            return new SumOfOwedPaymentsInFamily(currentList, increasedSum);
                        }));
        return map;
    }

    private List<Sms> createMessagesToDebtors(Map<String, SumOfOwedPaymentsInFamily> combinedOwedPayments) {
        return new ArrayList<>(combinedOwedPayments.values().stream()
                .map(sumOfOwedPaymentsInFamily -> {
                    List<Person> persons = sumOfOwedPaymentsInFamily.persons;
                    if (persons.size() == 1) {
                        return new Sms(persons.getFirst(), formatSmsMessage(sumOfOwedPaymentsInFamily.owedPayment));
                    } else {
                        return new Sms(persons.getFirst().getFamily(), formatSmsMessage(sumOfOwedPaymentsInFamily.owedPayment));
                    }
                })
                .toList());
    }

    private Optional<PaymentList> getPaymentList(YearMonth yearMonth, ListType type) {
        return paymentListRepository.findByYearAndMonthAndType(yearMonth.getYear(), yearMonth.getMonthValue(), type);
    }

    /**
     * List of {@link Person} objects and their collective debt from unpaid Payments.
     */
    protected record SumOfOwedPaymentsInFamily(List<Person> persons, BigDecimal owedPayment) {}

    private BulkSendRequest getBulkSendRequest() {
        return new BulkSendRequest()
                .withName("AtomDance:" + appClock.today().format(DateTimeFormatter.BASIC_ISO_DATE))
                .withBulkType(BulkSendRequest.BulkType.PERSONALIZED)
                .withBulkVariant(BulkSendRequest.BulkVariant.PRO)
                .withSender("Atom Dance")
                .withSendDate(appClock.nowOffset().plusMinutes(10L));
    }

    private String formatSmsMessage(BigDecimal owedAmount) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols();
        symbols.setDecimalSeparator(',');

        DecimalFormat formatter = new DecimalFormat("0.00", symbols);

        return STANDARD_TEMPLATE.formatted(formatter.format(owedAmount));
    }

}
