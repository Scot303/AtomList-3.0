package atomdance.app.modules.attendance.service;

import atomdance.app.modules.attendance.model.GenResultPayload;
import atomdance.app.modules.attendance.service.pdf.AttendancePdfGenerator;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class AttendancePdfService {

	private final GroupService groupService;
	private final AttendancePdfGenerator attendancePdfGenerator;
	private final AuditLogger auditLogger;


	@Transactional(readOnly = true)
	public GenResultPayload getGroupAttendancePdf(UUID groupId) throws IOException {
		Group group = groupService.getOrThrow(groupId);
		GenResultPayload genResult;

		try {
			genResult = attendancePdfGenerator.generateAttendancePdf(group);
		} catch (IOException e) {
			var errorMsg = "Failed to create group %s attendance list PDF".formatted(group.getName());
			auditLogger.failure(AuditEventType.ATTENDANCE_PDF_CREATION, group.getId(), errorMsg);
			throw e;
		}

		auditLogger.successNow(AuditEventType.ATTENDANCE_PDF_CREATION, group.getId(), "Created group %s attendance PDF.", group.getName());
		return genResult;
	}
}
