package atomdance.app.common.ratelimit;

import atomdance.app.common.exception.ErrorResponseWriter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

	/**
	 * Ceiling on distinct clients tracked at once, so the limiter cannot itself be turned into a
	 * memory-exhaustion vector by rotating source addresses.
	 */
	private static final int MAX_TRACKED_CLIENTS = 100_000;

	private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

	private final RateLimitProperties properties;
	private final ErrorResponseWriter errorResponseWriter;

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if (!properties.isEnabled()) {
			return true;
		}

		if ("OPTIONS".equals(request.getMethod())) {
			return true;
		}

		return !properties.getPaths().contains(request.getRequestURI());
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {

		String clientIp = resolveClientIp(request);
		String key = clientIp + "|" + request.getRequestURI();
		long now = System.nanoTime();

		TokenBucket bucket = buckets.get(key);

		if (bucket == null) {
			if (buckets.size() >= MAX_TRACKED_CLIENTS) {
				evictIdleBuckets();
			}

			if (buckets.size() >= MAX_TRACKED_CLIENTS) {
				log.warn("Rate limit tracking is at capacity ({} clients); not throttling {}", MAX_TRACKED_CLIENTS, clientIp);

				filterChain.doFilter(request, response);
				return;
			}

			bucket = buckets.computeIfAbsent(key,
					ignored -> new TokenBucket(properties.getCapacity(), properties.getRefillPeriod().toNanos(), now));
		}

		if (bucket.tryConsume(now)) {
			filterChain.doFilter(request, response);
			return;
		}

		log.warn("Rate limit exceeded for {} on {}", clientIp, request.getRequestURI());

		writeTooManyRequests(request, response, bucket.retryAfterSeconds(now));
	}

	String resolveClientIp(HttpServletRequest request) {
		HttpServletRequest raw = unwrap(request);

		int trustedHops = properties.getTrustedProxyCount();

		if (trustedHops <= 0) {
			return raw.getRemoteAddr();
		}

		String forwarded = raw.getHeader("X-Forwarded-For");

		if (forwarded == null || forwarded.isBlank()) {
			return raw.getRemoteAddr();
		}

		String[] entries = forwarded.split(",");
		int index = entries.length - trustedHops;

		if (index < 0) {
			index = 0;
		}

		String candidate = entries[index].trim();

		return candidate.isEmpty() ? raw.getRemoteAddr() : candidate;
	}

	/**
	 * The request as the container built it, before any filter wrapped it.
	 */
	private static HttpServletRequest unwrap(HttpServletRequest request) {
		HttpServletRequest current = request;

		while (current instanceof HttpServletRequestWrapper wrapper && wrapper.getRequest() instanceof HttpServletRequest inner && inner != current) {
			current = inner;
		}

		return current;
	}

	private void writeTooManyRequests(HttpServletRequest request, HttpServletResponse response, long retryAfterSeconds) throws IOException {
		response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(retryAfterSeconds));

		errorResponseWriter.write(
				request,
				response,
				HttpStatus.TOO_MANY_REQUESTS,
				"RATE_LIMIT_429",
				"error.rate_limit_exceeded",
				new Object[]{retryAfterSeconds},
				"Too many requests. Please try again later."
		);
	}

	@Scheduled(fixedDelay = 10, timeUnit = TimeUnit.MINUTES)
	void evictIdleBuckets() {
		long now = System.nanoTime();

		buckets.entrySet().removeIf(entry -> entry.getValue().isIdle(now));
	}
}
