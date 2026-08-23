package atomdance.app.modules.attendance.service;

import atomdance.app.modules.attendance.service.pdf.AttendancePdfGenerator;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.service.GroupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendancePdfService {

    private final GroupService groupService;
    private final AttendancePdfGenerator attendancePdfGenerator;
    private final AuditLogger auditLogger;

    public byte[] getGroupAttendancePdf(UUID groupId) throws IOException {
        Group group = groupService.getOrThrow(groupId);
        byte[] pdfBytes;

        try {
            pdfBytes = attendancePdfGenerator.generateAttendancePdf(group);
        } catch (IOException e) {
            var errorMsg = "Failed to create group %s attendance list PDF".formatted(group.getId());
            log.error(errorMsg);
            auditLogger.record(null, group.getId(), AuditEventType.ATTENDANCE_PDF_CREATION, AuditOutcome.FAILURE, errorMsg);
            throw e;
        }

        auditLogger.record(null, group.getId(), AuditEventType.ATTENDANCE_PDF_CREATION, AuditOutcome.SUCCESS, "Created group attendance PDF.");
        return pdfBytes;
    }

}
