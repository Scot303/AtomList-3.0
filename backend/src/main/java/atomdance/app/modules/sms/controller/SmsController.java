package atomdance.app.modules.sms.controller;

import atomdance.app.modules.sms.dto.SendSmsRequest;
import atomdance.app.modules.sms.dto.SmsSendResultView;
import atomdance.app.modules.sms.dto.SmsView;
import atomdance.app.modules.sms.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/sms")
@RequiredArgsConstructor
public class SmsController {


	private final SmsService smsService;


	@GetMapping
	@PreAuthorize("hasAuthority('READ_SMS')")
	public List<SmsView> getAll() {
		return smsService.getAll();
	}


	/**
	 * One message to any number of people, named directly or through the groups they attend.
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('SEND_SMS')")
	public SmsSendResultView send(@RequestBody @Valid SendSmsRequest request) {
		return smsService.send(request);
	}


}
