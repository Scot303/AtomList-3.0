package atomdance.app.common.security;

import atomdance.app.common.exception.ErrorResponseWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

/**
 * Cross-site request forgery cover for the handful of endpoints that authenticate from a cookie.
 */
@Slf4j
public class CookieAuthCsrfFilter extends OncePerRequestFilter {

	public static final String HEADER = "X-Auth-Request";

	private final Set<String> protectedPaths;
	private final ErrorResponseWriter errorResponseWriter;

	public CookieAuthCsrfFilter(Set<String> protectedPaths, ErrorResponseWriter errorResponseWriter) {
		this.protectedPaths = Set.copyOf(protectedPaths);
		this.errorResponseWriter = errorResponseWriter;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return "OPTIONS".equals(request.getMethod()) || !protectedPaths.contains(request.getRequestURI());
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

		if (request.getHeader(HEADER) != null) {
			filterChain.doFilter(request, response);
			return;
		}

		log.warn("Rejecting {} on {} - the {} header is missing", request.getMethod(), request.getRequestURI(), HEADER);

		errorResponseWriter.write(
				request,
				response,
				HttpStatus.FORBIDDEN,
				"CSRF_403",
				"error.csrf_header_missing",
				new Object[]{HEADER},
				"This request must carry the " + HEADER + " header."
		);
	}
}
