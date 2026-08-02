package atomdance.app.config;

import atomdance.app.common.ratelimit.RateLimitFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RateLimitConfig {

	/**
	 * Spring Boot auto-registers any {@code Filter} bean into the servlet container's chain, which
	 * would run the limiter a second time outside the security chain and charge two tokens per
	 * request. {@link SecurityConfig} places it explicitly, so the automatic registration is
	 * switched off here.
	 */
	@Bean
	public FilterRegistrationBean<RateLimitFilter> rateLimitFilterRegistration(RateLimitFilter filter) {
		FilterRegistrationBean<RateLimitFilter> registration = new FilterRegistrationBean<>(filter);
		registration.setEnabled(false);

		return registration;
	}
}