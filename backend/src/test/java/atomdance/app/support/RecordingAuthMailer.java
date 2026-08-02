package atomdance.app.support;

import atomdance.app.common.mail.AuthMailer;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Stands in for the mail server so tests can read the code that was sent.
 */
public class RecordingAuthMailer implements AuthMailer {

	public record SentLoginCode(String email, String recipientName, String displayCode) {}

	public record SentVerification(String email, String recipientName, String url) {}

	private final List<SentLoginCode> loginCodes = new CopyOnWriteArrayList<>();
	private final List<SentVerification> verifications = new CopyOnWriteArrayList<>();

	@Override
	public void sendLoginCode(String email, String recipientName, String displayCode, long validForMinutes, Locale locale) {
		loginCodes.add(new SentLoginCode(email, recipientName, displayCode));
	}

	@Override
	public void sendEmailVerification(String email, String recipientName, String verificationUrl, long validForHours, Locale locale) {
		verifications.add(new SentVerification(email, recipientName, verificationUrl));
	}

	public void clear() {
		loginCodes.clear();
		verifications.clear();
	}

	public List<SentLoginCode> loginCodes() {
		return List.copyOf(loginCodes);
	}

	public List<SentVerification> verifications() {
		return List.copyOf(verifications);
	}

	public Optional<SentLoginCode> lastLoginCode() {
		return loginCodes.isEmpty() ? Optional.empty() : Optional.of(loginCodes.getLast());
	}

	public Optional<SentVerification> lastVerification() {
		return verifications.isEmpty() ? Optional.empty() : Optional.of(verifications.getLast());
	}
}
