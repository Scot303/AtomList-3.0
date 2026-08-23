package atomdance.app.modules.attendance.controller;

import atomdance.app.modules.attendance.service.AttendancePdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceListController {

    private AttendancePdfService attendancePdfService;

    @GetMapping(value = "/{groupId}", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAuthority('PRINT_ATTENDANCE')")
    public ResponseEntity<byte[]> getGroupAttendancePdf(@PathVariable UUID groupId) {
        try {
            var pdfBytes = attendancePdfService.getGroupAttendancePdf(groupId);
            var headers = new HttpHeaders();

            // display file in browser
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=obecnosc.pdf");
            // prevent client-side caching if data is dynamic
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(pdfBytes.length)
                    .body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

}
