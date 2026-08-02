package atomdance.app.common.security;

import atomdance.app.common.exception.ErrorResponseWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Answers requests from a caller who is authenticated but lacks the required permission.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RestAccessDeniedHandler implements AccessDeniedHandler {

	private final ErrorResponseWriter errorResponseWriter;

	@Override
	public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException accessDeniedException) throws IOException {

		log.warn("Access denied on {}: {}", request.getRequestURI(), accessDeniedException.getMessage());

		errorResponseWriter.write(
				request,
				response,
				HttpStatus.FORBIDDEN,
				"ACCESS_DENIED_403",
				"error.access_denied",
				null,
				"You do not have permission to perform this action."
		);
	}
}
