package atomdance.app.modules.user.dto;

public record LoginResponse(
		String token,
		UserInfo user
) {}
