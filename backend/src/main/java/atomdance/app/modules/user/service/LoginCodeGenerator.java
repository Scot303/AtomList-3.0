package atomdance.app.modules.user.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

/**
 * Produces the one-time code that replaces the password.
 */
@Component
public class LoginCodeGenerator {

	/**
	 * Deliberately missing {@code I l 1 O o 0}.
	 */
	private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#".toCharArray();
	private static final int GROUP_SIZE = 4;

	private final SecureRandom secureRandom = new SecureRandom();


	public String generate(int length) {
		StringBuilder code = new StringBuilder(length);

		for (int i = 0; i < length; i++) {
			code.append(ALPHABET[secureRandom.nextInt(ALPHABET.length)]);
		}

		return code.toString();
	}

	/**
	 * The same code split into groups of four for the email body. Purely a reading aid.
	 */
	public String forDisplay(String code) {
		StringBuilder grouped = new StringBuilder(code.length() + code.length() / GROUP_SIZE);

		for (int i = 0; i < code.length(); i++) {
			if (i > 0 && i % GROUP_SIZE == 0) {
				grouped.append(' ');
			}

			grouped.append(code.charAt(i));
		}

		return grouped.toString();
	}

	/**
	 * Undoes anything a mail client, a clipboard, or a hesitant typist added. Only whitespace is removed.
	 */
	public static String normalize(String submitted) {
		return submitted == null ? "" : submitted.replaceAll("\\s", "");
	}
}
