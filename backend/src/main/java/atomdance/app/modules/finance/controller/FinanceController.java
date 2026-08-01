package atomdance.app.modules.finance.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

	@GetMapping
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public ResponseEntity<String> list() {
		return ResponseEntity.ok("finance data placeholder");
	}

	@PostMapping
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public ResponseEntity<Void> create() {
		return ResponseEntity.status(HttpStatus.CREATED).build();
	}
}
