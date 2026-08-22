package atomdance.app.modules.sms.controller;

import atomdance.app.modules.sms.dto.CreateSmsRequest;
import atomdance.app.modules.sms.dto.SmsView;
import atomdance.app.modules.sms.service.SmsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('SEND_SMS')")
    public SmsView create(@RequestBody @Valid CreateSmsRequest request) {
        return smsService.create(request);
    }


}
