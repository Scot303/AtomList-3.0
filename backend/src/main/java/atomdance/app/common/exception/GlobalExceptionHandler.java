package atomdance.app.common.exception;

import atomdance.app.common.utils.AppClock;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

	private final MessageSource messageSource;
	private final AppClock clock;

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
		log.debug("Authentication failed: {}", ex.getMessage());

		return translate(HttpStatus.UNAUTHORIZED, "USER_401", "error.user_not_authenticated");
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
		log.warn("Access denied: {}", ex.getMessage());

		return translate(HttpStatus.FORBIDDEN, "ACCESS_DENIED_403", "error.access_denied");
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
		String details = ex.getBindingResult().getFieldErrors().stream()
				.map(DefaultMessageSourceResolvable::getDefaultMessage)
				.collect(Collectors.joining("; "));

		return createErrorResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", details);
	}

	@ExceptionHandler(BaseException.class)
	public ResponseEntity<ErrorResponse> handleBaseException(BaseException ex) {
		Locale locale = LocaleContextHolder.getLocale();

		String translatedMessage = messageSource.getMessage(
				ex.getMessageKey(),
				ex.getArgs(),
				"An unexpected error occurred.",
				locale
		);

		return createErrorResponse(ex.getStatus(), ex.getErrorCode(), translatedMessage);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
		log.error("Unhandled exception: {}", ex.getMessage(), ex);

		return translate(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", "error.internal_server_error");
	}

	private ResponseEntity<ErrorResponse> translate(HttpStatus status, String code, String messageKey) {
		String message = messageSource.getMessage(messageKey, null, status.getReasonPhrase(), LocaleContextHolder.getLocale());

		return createErrorResponse(status, code, message);
	}

	private ResponseEntity<ErrorResponse> createErrorResponse(HttpStatus status, String code, String message) {
		ErrorResponse response = new ErrorResponse(
				status.value(),
				code,
				message,
				clock.nowOffset()
		);

		return new ResponseEntity<>(response, status);
	}
}
