package atomdance.app.modules.user.dto;

public record IssuedSession(
		String accessToken,
		String refreshToken,
		UserInfo user
) {}
