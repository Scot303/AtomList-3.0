package atomdance.app.common.utils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

public final class OpaqueTokens {

	private static final int TOKEN_BYTES = 32;
	private static final SecureRandom RANDOM = new SecureRandom();

	private OpaqueTokens() {
	}

	/**
	 * A fresh URL-safe token. This is the only moment its raw value exists server-side.
	 */
	public static String generate() {
		byte[] raw = new byte[TOKEN_BYTES];
		RANDOM.nextBytes(raw);

		return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
	}

	/**
	 * The 64-character hex digest that gets persisted in place of the token.
	 */
	public static String hash(String rawToken) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");

			return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 is required by every JVM but is missing", e);
		}
	}
}
