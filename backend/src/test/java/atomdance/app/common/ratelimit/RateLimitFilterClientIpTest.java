package atomdance.app.common.ratelimit;

import atomdance.app.common.exception.ErrorResponseWriter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Client identification decides who shares a rate-limit bucket, so getting it wrong either throttles everyone together or throttles nobody at all.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RateLimitFilterClientIpTest {

	@Mock
	private ErrorResponseWriter errorResponseWriter;

	private RateLimitProperties properties;
	private RateLimitFilter filter;

	@BeforeEach
	void setUp() {
		properties = new RateLimitProperties();
		filter = new RateLimitFilter(properties, errorResponseWriter);
	}

	@Test
	void ignoresTheForwardedHeaderWhenNoProxyIsTrusted() {
		properties.setTrustedProxyCount(0);

		MockHttpServletRequest request = request("203.0.113.9", "198.51.100.1");

		assertThat(filter.resolveClientIp(request)).isEqualTo("203.0.113.9");
	}

	@Test
	void takesTheEntryBeforeTheSingleTrustedProxy() {
		properties.setTrustedProxyCount(1);

		// The platform appended the caller's real address as the last entry.
		MockHttpServletRequest request = request("10.0.0.1", "198.51.100.1");

		assertThat(filter.resolveClientIp(request)).isEqualTo("198.51.100.1");
	}

	@Test
	void isNotFooledByACallerSuppliedForwardedHeader() {
		properties.setTrustedProxyCount(1);

		// The caller sent "X-Forwarded-For: 1.2.3.4" hoping to be identified by it; the proxy appended
		// their real address behind it. Counting from the left would hand them a fresh bucket for
		// every value they invent, which is a complete bypass of the limiter.
		MockHttpServletRequest request = request("10.0.0.1", "1.2.3.4, 198.51.100.1");

		assertThat(filter.resolveClientIp(request)).isEqualTo("198.51.100.1");
	}

	@Test
	void countsBackTwoHopsWhenTwoProxiesAreTrusted() {
		properties.setTrustedProxyCount(2);

		// Two proxies produce two entries, not three: the outer one records the caller, the inner one
		// records the outer proxy, and the app's socket address is the inner proxy (never in the header).
		MockHttpServletRequest request = request("10.0.0.1", "198.51.100.1, 172.16.0.5");

		assertThat(filter.resolveClientIp(request)).isEqualTo("198.51.100.1");
	}

	@Test
	void skipsACallerSuppliedEntryWithTwoTrustedProxies() {
		properties.setTrustedProxyCount(2);

		// Same two-hop path, but the caller prepended a value of their own. Only the two trailing
		// entries were written by our infrastructure, so the caller is the one just before them.
		MockHttpServletRequest request = request("10.0.0.1", "1.2.3.4, 198.51.100.1, 172.16.0.5");

		assertThat(filter.resolveClientIp(request)).isEqualTo("198.51.100.1");
	}

	@Test
	void fallsBackToTheSocketAddressWhenTheHeaderIsAbsent() {
		properties.setTrustedProxyCount(1);

		MockHttpServletRequest request = request("203.0.113.9", null);

		assertThat(filter.resolveClientIp(request)).isEqualTo("203.0.113.9");
	}

	@Test
	void clampsToTheFirstEntryWhenThereAreFewerHopsThanConfigured() {
		properties.setTrustedProxyCount(3);

		// Misconfiguration or an unexpected path - must not read past the start of the array.
		MockHttpServletRequest request = request("10.0.0.1", "198.51.100.1");

		assertThat(filter.resolveClientIp(request)).isEqualTo("198.51.100.1");
	}

	private static MockHttpServletRequest request(String remoteAddr, String forwardedFor) {
		MockHttpServletRequest request = new MockHttpServletRequest();
		request.setRemoteAddr(remoteAddr);

		if (forwardedFor != null) {
			request.addHeader("X-Forwarded-For", forwardedFor);
		}

		return request;
	}
}
