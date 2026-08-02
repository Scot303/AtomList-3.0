package atomdance.app.modules.user.controller;

import atomdance.app.common.security.RefreshCookieService;
import atomdance.app.modules.user.dto.*;
import atomdance.app.modules.user.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

	private final AuthService authService;
	private final RefreshCookieService refreshCookieService;

	/**
	 * Step one of signing in: ask for a code.
	 */
	@PostMapping("/otp/request")
	public ResponseEntity<Void> requestLoginCode(@RequestBody @Valid IdentifierRequest request) {
		authService.requestLoginCode(request.identifier());

		return ResponseEntity.accepted().build();
	}

	/**
	 * Step two: exchange the mailed code for a session.
	 */
	@PostMapping("/otp/verify")
	public ResponseEntity<LoginResponse> verifyLoginCode(@RequestBody @Valid VerifyLoginCodeRequest request) {
		IssuedSession session = authService.verifyLoginCode(request.identifier(), request.code());

		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, refreshCookieService.issue(session.refreshToken()).toString())
				.body(new LoginResponse(session.accessToken(), session.user()));
	}

	/**
	 * Rotates the session. The presented token comes from the cookie the browser attaches on its own,
	 * so there is nothing for the client to send and nothing for it to have stored.
	 */
	@PostMapping("/refresh")
	public ResponseEntity<TokenResponse> refresh(HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
		IssuedSession session;

		try {
			session = authService.refresh(refreshCookieService.read(httpRequest));
		} catch (RuntimeException e) {
			httpResponse.addHeader(HttpHeaders.SET_COOKIE, refreshCookieService.clear().toString());
			throw e;
		}

		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, refreshCookieService.issue(session.refreshToken()).toString())
				.body(new TokenResponse(session.accessToken()));
	}

	/**
	 * Lets a client re-read its own permissions without signing in again.
	 */
	@GetMapping("/me")
	public UserInfo me() {
		return authService.currentUser();
	}

	/**
	 * Ends this one session.
	 */
	@PostMapping("/logout")
	public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
		authService.logout(refreshCookieService.read(httpRequest));

		return clearedCookieResponse();
	}

	@PostMapping("/logout-all")
	public ResponseEntity<Void> logoutEverywhere() {
		authService.logoutEverywhere();

		return clearedCookieResponse();
	}

	/**
	 * Confirms an address from a mailed link.
	 */
	@PostMapping("/email/verify")
	public ResponseEntity<Void> verifyEmail(@RequestBody @Valid VerifyEmailRequest request) {
		authService.verifyEmail(request.token());

		return ResponseEntity.noContent().build();
	}

	@PostMapping("/email/resend")
	public ResponseEntity<Void> resendVerification(@RequestBody @Valid IdentifierRequest request) {
		authService.resendVerification(request.identifier());

		return ResponseEntity.accepted().build();
	}

	private ResponseEntity<Void> clearedCookieResponse() {
		return ResponseEntity.noContent()
				.header(HttpHeaders.SET_COOKIE, refreshCookieService.clear().toString())
				.build();
	}
}
