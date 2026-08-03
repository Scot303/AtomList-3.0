package atomdance.app.config;

import atomdance.app.common.mail.AuthMailer;
import atomdance.app.common.mail.LoggingAuthMailer;
import atomdance.app.common.mail.MailProperties;
import atomdance.app.common.mail.ResendAuthMailer;
import atomdance.app.modules.audit.service.AuditLogger;
import com.resend.Resend;
import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

@Configuration
public class MailConfig {

	/**
	 * Picks the mailer from whether a Resend API key was supplied.
	 */
	@Bean
	public AuthMailer authMailer(MessageSource messageSource, MailProperties mailProperties, Environment environment, AuditLogger auditLogger) {

		String apiKey = mailProperties.getResend().getApiKey();

		return StringUtils.hasText(apiKey)
				? new ResendAuthMailer(new Resend(apiKey), messageSource, mailProperties, auditLogger)
				: new LoggingAuthMailer(environment);
	}
}
