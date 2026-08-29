package atomdance.app.modules.attendance.service;

import atomdance.app.modules.attendance.model.GenResultPayload;
import atomdance.app.modules.attendance.service.pdf.AttendancePdfGenerator;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.service.GroupService;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendancePdfService {

    private final GroupService groupService;
    private final AttendancePdfGenerator attendancePdfGenerator;
    private final AuditLogger auditLogger;
    private final SecurityService securityService;


    @Transactional(readOnly = true)
    public GenResultPayload getGroupAttendancePdf(UUID groupId) throws IOException {
        Group group = groupService.getOrThrow(groupId);
        GenResultPayload genResult;

        try {
            genResult = attendancePdfGenerator.generateAttendancePdf(group);
        } catch (IOException e) {
            var errorMsg = "Failed to create group %s attendance list PDF".formatted(group.getId());
            log.error(errorMsg);
            auditLogger.record(securityService.getCurrentUserId(), group.getId(), AuditEventType.ATTENDANCE_PDF_CREATION, AuditOutcome.FAILURE, errorMsg);
            throw e;
        }

        auditLogger.record(securityService.getCurrentUserId(), group.getId(), AuditEventType.ATTENDANCE_PDF_CREATION, AuditOutcome.SUCCESS, "Created group attendance PDF.");
        return genResult;
    }
}
