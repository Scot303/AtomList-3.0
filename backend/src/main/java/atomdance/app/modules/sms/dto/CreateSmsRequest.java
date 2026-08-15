package atomdance.app.modules.sms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateSmsRequest (

        @NotBlank(message = "Message is required")
        @Size(max = 140, message = "Message is too long")
        String message,

        @NotNull(message = "Person is required")
        UUID personId
) {}
