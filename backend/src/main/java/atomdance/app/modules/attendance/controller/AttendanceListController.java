package atomdance.app.modules.attendance.controller;

import atomdance.app.modules.attendance.service.AttendancePdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;


@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceListController {

	private final AttendancePdfService attendancePdfService;


	@GetMapping(value = "/{groupId}", produces = MediaType.APPLICATION_PDF_VALUE)
	@PreAuthorize("hasAuthority('PRINT_ATTENDANCE')")
	public ResponseEntity<byte[]> getGroupAttendancePdf(@PathVariable UUID groupId) throws IOException {
		var genResultPayload = attendancePdfService.getGroupAttendancePdf(groupId);

		var disposition = ContentDisposition.inline()
				.filename(genResultPayload.fileName(), StandardCharsets.UTF_8)
				.build();

		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
				.contentType(MediaType.APPLICATION_PDF)
				.contentLength(genResultPayload.pdfBytes().length)
				.body(genResultPayload.pdfBytes());
	}
}
