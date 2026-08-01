package atomdance.app.common.exception;

import java.time.OffsetDateTime;

public record ErrorResponse(
		int status,
		String errorCode,
		String message,
		OffsetDateTime timestamp
) {}
