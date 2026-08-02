package atomdance.app.modules.user.service;

import atomdance.app.modules.user.dto.IssuedSession;
import atomdance.app.modules.user.dto.UserInfo;
import atomdance.app.modules.user.exception.*;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * There is no password anywhere in here. Sign-in is a one-time code mailed to the address on the
 * account ({@link LoginCodeService}), which is why the address itself has to be verified
 * ({@link EmailVerificationService}) before it can be trusted as a delivery channel.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

	private final JwtService jwtService;
	private final RefreshTokenService refreshTokenService;
	private final UserRepository userRepository;
	private final SecurityService securityService;
	private final LoginCodeService loginCodeService;
	private final EmailVerificationService emailVerificationService;

	/**
	 * Step one of signing in.
	 */
	@Transactional
	public void requestLoginCode(String identifier) {
		loginCodeService.requestCode(identifier);
	}

	/**
	 * Step two: exchange the mailed code for a session.
	 */
	@Transactional(noRollbackFor = {InvalidLoginCodeException.class, AccountLockedException.class, AccountInactiveException.class, EmailNotVerifiedException.class})
	public IssuedSession verifyLoginCode(String identifier, String code) {
		User user = loginCodeService.verifyCode(identifier, code);

		return issueSessionFor(user);
	}

	/**
	 * Rotates the presented refresh token for a fresh pair.
	 */
	@Transactional(noRollbackFor = {InvalidRefreshTokenException.class, AccountInactiveException.class})
	public IssuedSession refresh(String presentedRefreshToken) {
		User user = refreshTokenService.consume(presentedRefreshToken);

		if (!user.isActive()) {
			throw new AccountInactiveException();
		}

		return issueSessionFor(user);
	}

	@Transactional(readOnly = true)
	public UserInfo currentUser() {
		return userRepository.findByIdWithPermissions(securityService.getCurrentUserId())
				.map(UserInfo::from)
				.orElseThrow(UserNotAuthenticatedException::new);
	}

	/**
	 * Ends the session belonging to the presented refresh token.
	 */
	@Transactional
	public void logout(String presentedRefreshToken) {
		refreshTokenService.revoke(presentedRefreshToken);
	}

	/**
	 * Ends every session for the caller. Both halves - refresh-token revocation and the token-version
	 * bump - happen inside {@code RefreshTokenService#revokeAllForUser}.
	 */
	@Transactional
	public void logoutEverywhere() {
		UUID userId = securityService.getCurrentUserId();

		if (!userRepository.existsById(userId)) {
			throw new UserNotAuthenticatedException();
		}

		refreshTokenService.revokeAllForUser(userId);
	}

	/**
	 * Confirms an address from a mailed link. Public by necessity - the person clicking it has no
	 * session yet, which is the whole reason the link exists.
	 */
	@Transactional
	public void verifyEmail(String token) {
		emailVerificationService.verify(token);
	}

	/**
	 * Re-sends a verification link. Silent about whether the account exists, whether it was already
	 * verified, and whether anything was actually sent.
	 */
	@Transactional
	public void resendVerification(String identifier) {
		userRepository.findByUsernameOrEmailWithPermissions(LoginCodeService.normalizeIdentifier(identifier))
				.filter(User::isActive)
				.filter(user -> !user.isEmailVerified())
				.ifPresent(emailVerificationService::issueIfOutsideCooldown);
	}

	private IssuedSession issueSessionFor(User user) {
		return new IssuedSession(
				jwtService.generateToken(user),
				refreshTokenService.issue(user),
				UserInfo.from(user)
		);
	}
}
