package atomdance.app.modules.sms.dto;

import atomdance.app.modules.sms.model.Sms;

import java.util.UUID;

public record SmsView(
        UUID id,
        String message,
        UUID personId,
        UUID familyId,
        String sentToPhone
) {
    public static SmsView from(Sms sms) {
        return new SmsView(
                sms.getId(),
                sms.getMessage(),
                sms.getPerson().getId(),
                sms.getFamily().getId(),
                sms.getSentToPhone()
        );
    }
}
