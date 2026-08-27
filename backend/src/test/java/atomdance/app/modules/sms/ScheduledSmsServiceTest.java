package atomdance.app.modules.sms;

import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.sms.model.Sms;
import atomdance.app.modules.sms.service.SmsService;
import atomdance.app.modules.sms.service.ScheduledSmsService;
import atomdance.app.common.sms.SmsApiClient;
import org.apache.commons.lang3.RandomStringUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.stubbing.Answer;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ScheduledSmsServiceTest {

    private final AppClock appClock = new AppClock("Europe/Warsaw");
    private final SmsService smsService = mock(SmsService.class);
    private final PaymentListRepository paymentListRepository = mock(PaymentListRepository.class);
    private final PaymentRepository paymentRepository = mock(PaymentRepository.class);
    private final SmsApiClient smsApiClient = mock(SmsApiClient.class);
    private final AuditLogger auditLogger = mock(AuditLogger.class);
    private final List<String> phoneWhitelist = new ArrayList<>();
    private static ScheduledSmsService scheduledSmsService;

    @BeforeEach
    void setupScheduledService() {
        scheduledSmsService = new ScheduledSmsService(appClock, smsService, paymentListRepository, paymentRepository, smsApiClient, auditLogger, phoneWhitelist);
    }


    @Test
    void shouldProduceSingleSmsForMembersOfOneFamily() {
        // given
        var familyPhoneNumber = RandomStringUtils.secure().nextNumeric(9);

        // when
        when(paymentListRepository.findByYearAndMonthAndType(anyInt(), anyInt(), any(ListType.class)))
                .thenReturn(mockPaymentList());

        when(paymentRepository.findUnpaidByListId(any(UUID.class)))
                .thenAnswer((Answer<List<Payment>>) invocation -> mockUnpaidPayment(invocation.getArgument(0), familyPhoneNumber));

        scheduledSmsService.scheduleSms();

        // then
        var smsServiceArgumentCaptor = ArgumentCaptor.forClass(List.class);
        verify(smsService).saveSentScheduledBulkSms((List<Sms>) smsServiceArgumentCaptor.capture());
        assertEquals(1, smsServiceArgumentCaptor.getValue().size());

        Sms combinedSms = (Sms) smsServiceArgumentCaptor.getValue().getFirst();
        assertEquals("Przypominamy o uregulowaniu płatności za zajęcia. Dziękujemy!", combinedSms.getMessage());
        assertEquals(familyPhoneNumber, combinedSms.getSentToPhone());
    }

    private static Optional<PaymentList> mockPaymentList() {
        return Optional.of(PaymentList.builder()
                .id(UUID.randomUUID()).build());
    }

    private static List<Payment> mockUnpaidPayment(UUID uuid, String familyNumber) {
        return List.of(Payment.builder()
                .amountToPay(BigDecimal.valueOf(50.50))
                .person(Person.builder()
                        .id(uuid)
                        .phone(null)
                        .family(Family.builder()
                                .phone(familyNumber)
                                .build())
                        .build())
                .build());
    }


}
