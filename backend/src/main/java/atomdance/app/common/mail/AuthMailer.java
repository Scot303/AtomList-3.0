package atomdance.app.common.mail;

import java.util.Locale;

public interface AuthMailer {

	void sendLoginCode(String email, String recipientName, String displayCode, long validForMinutes, Locale locale);

	void sendEmailVerification(String email, String recipientName, String verificationUrl, long validForHours, Locale locale);
}
