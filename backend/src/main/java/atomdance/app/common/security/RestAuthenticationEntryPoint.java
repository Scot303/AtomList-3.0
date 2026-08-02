package atomdance.app.common.security;

import atomdance.app.common.exception.ErrorResponseWriter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Answers requests that arrive without a usable token.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private final ErrorResponseWriter errorResponseWriter;

	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {

		log.debug("Rejected unauthenticated request to {}: {}", request.getRequestURI(), authException.getMessage());

		errorResponseWriter.write(
				request,
				response,
				HttpStatus.UNAUTHORIZED,
				"USER_401",
				"error.user_not_authenticated",
				null,
				"Authentication is required to access this resource."
		);
	}
}
