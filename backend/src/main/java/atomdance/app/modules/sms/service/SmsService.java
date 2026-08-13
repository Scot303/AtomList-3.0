package atomdance.app.modules.sms.service;


import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.sms.model.Sms;
import atomdance.app.modules.sms.repository.SmsRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {
    private final SmsRepository smsRepository;
    private final AuditLogger auditLogger;

    @Transactional
    public void saveSentScheduledSms(List<Sms> sentSms) {
        smsRepository.saveAllAndFlush(sentSms);

        String logMsg = "Created %d Sms records".formatted(sentSms.size());
        auditLogger.recordOnCommit(null, AuditEventType.SMS_CREATION, AuditOutcome.SUCCESS, logMsg);
        log.info(logMsg);
    }

}
