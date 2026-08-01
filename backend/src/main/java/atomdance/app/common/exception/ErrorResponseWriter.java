package atomdance.app.common.exception;

import atomdance.app.common.utils.AppClock;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.MessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class ErrorResponseWriter {

	/**
	 * Built here rather than injected: this only ever serializes one small record, so it does not need the full MVC converter stack.
	 */
	private final ObjectMapper objectMapper = new ObjectMapper()
			.registerModule(new JavaTimeModule())
			.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

	private final MessageSource messageSource;
	private final AppClock clock;

	public ErrorResponseWriter(MessageSource messageSource, AppClock clock) {
		this.messageSource = messageSource;
		this.clock = clock;
	}

	public void write(HttpServletRequest request, HttpServletResponse response, HttpStatus status, String errorCode, String messageKey, Object[] args, String fallbackMessage) throws IOException {

		String message = messageSource.getMessage(messageKey, args, fallbackMessage, request.getLocale());

		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding("UTF-8");

		ErrorResponse body = new ErrorResponse(status.value(), errorCode, message, clock.nowOffset());

		objectMapper.writeValue(response.getOutputStream(), body);
	}
}
