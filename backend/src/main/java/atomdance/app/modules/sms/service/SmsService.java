package atomdance.app.modules.sms.service;


import atomdance.app.modules.sms.exception.SmsSendException;
import atomdance.app.common.sms.SmsApiClient;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.service.PersonService;
import atomdance.app.modules.sms.dto.CreateSmsRequest;
import atomdance.app.modules.sms.dto.SmsView;
import atomdance.app.modules.sms.model.Sms;
import atomdance.app.modules.sms.repository.SmsRepository;
import atomdance.app.modules.user.service.SecurityService;
import atomdance.json.justsend.SingleSendRequest;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.List;

import static atomdance.app.common.utils.StaticValuesUtil.ATOM_DANCE_SENDER;
import static atomdance.app.common.utils.StaticValuesUtil.PHONE_COUNTRY_CODE;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {
    private final SmsRepository smsRepository;
    private final AuditLogger auditLogger;
    private final SmsApiClient smsApiClient;
    private final PersonService personService;
    private final SecurityService securityService;

    @Transactional
    public void saveSentScheduledBulkSms(List<Sms> sentSms) {
        smsRepository.saveAllAndFlush(sentSms);

        String logMsg = "Created %d Sms records".formatted(sentSms.size());
        auditLogger.recordOnCommit(null, AuditEventType.SMS_CREATION, AuditOutcome.SUCCESS, logMsg);
        log.info(logMsg);
    }

    @Transactional(readOnly = true)
    public List<SmsView> getAll() {
        List<Sms> smsList = smsRepository.findAll();

        auditLogger.record(securityService.getCurrentUserId(), AuditEventType.SMS_PREVIEW, AuditOutcome.SUCCESS, "Previewed all sms messages.");

        return smsList.stream()
                .map(SmsView::from)
                .toList();
    }

    //TODO Figure out fetch of sms send to person if they don't have their own phone number

    @Transactional
    public SmsView create(CreateSmsRequest request) {
        Sms.SmsBuilder smsBuilder = Sms.builder()
                .message(request.message());

        Person person = personService.getOrThrow(request.personId());
        if (StringUtils.isNotBlank(person.getPhone())) {
            smsBuilder.sentToPhone(person.getPhone())
                    .person(person);
        } else {
            smsBuilder.sentToPhone(person.getFamily().getPhone())
                    .family(person.getFamily());
        }

        Sms sms = smsBuilder.build();
        try {
            sendSingleSms(sms);
        } catch(SmsSendException e) {
            var errorMsg = "Failed to send sms to %s with content %s".formatted(sms.getSentToPhone(), sms.getMessage());
            log.error(errorMsg);
            auditLogger.record(null, AuditEventType.SMS_CREATION, AuditOutcome.FAILURE, errorMsg);
            throw e;
        }

        sms = smsRepository.saveAndFlush(sms);

        var realSmsGeneratedCount = Math.floorDiv(sms.getMessage().length(), 70);
        log.info("Created sms message to {}, content length - {}, generates {} actual sms messages", sms.getSentToPhone(), sms.getMessage().length(), realSmsGeneratedCount);
        auditLogger.recordOnCommit(null, sms.getId(), AuditEventType.SMS_CREATION, AuditOutcome.SUCCESS,
                String.format("Sms %s has been created.", sms.getId()));

        return SmsView.from(sms);
    }

    private void sendSingleSms(Sms sms) {
        SingleSendRequest ssr = new SingleSendRequest()
                .withBulkVariant(SingleSendRequest.BulkVariant.PRO)
                .withSender(ATOM_DANCE_SENDER)
                .withMsisdn(PHONE_COUNTRY_CODE + sms.getSentToPhone())
                .withContent(sms.getMessage());

        try {
            smsApiClient.singleSendMessage(ssr);
        } catch (HttpStatusCodeException e) {
            String errorMsg = "JustSend API returned %s: %s".formatted(e.getStatusCode(), e.getMessage());
            log.error(errorMsg);
            auditLogger.record(null, AuditEventType.SMS_SEND, AuditOutcome.FAILURE, errorMsg);
            throw new SmsSendException("entity.sms");
        }
    }
}
