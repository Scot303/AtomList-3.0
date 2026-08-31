package atomdance.app.modules.user.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NameTakenException;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.user.dto.AdminUserView;
import atomdance.app.modules.user.dto.CreateUserRequest;
import atomdance.app.modules.user.dto.UpdateUserRequest;
import atomdance.app.modules.user.exception.UserNotFoundException;
import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;
import atomdance.app.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;


/**
 * Account administration. Everything here is reachable only with {@code MANAGE_USERS}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

	private final UserRepository userRepository;
	private final RefreshTokenService refreshTokenService;
	private final EmailVerificationService emailVerificationService;
	private final AccountLockService accountLockService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;

	private static final Sort BY_USERNAME = Sort.by("username");


	private User getUserOrThrow(UUID id) {
		return userRepository.findByIdWithPermissions(id)
				.orElseThrow(() -> new UserNotFoundException(id.toString()));
	}


	@Transactional(readOnly = true)
	public List<AdminUserView> getAll() {
		Instant now = Instant.now();

		return userRepository.findAll(BY_USERNAME).stream().map(user -> AdminUserView.from(user, now)).toList();
	}


	@Transactional(readOnly = true)
	public AdminUserView get(UUID id) {
		return AdminUserView.from(getUserOrThrow(id), Instant.now());
	}


	/**
	 * Creates an account and mails the verification link that brings it to life.
	 */
	@Transactional
	public AdminUserView create(CreateUserRequest request) {
		String email = User.normalizeEmail(request.email());

		if (userRepository.existsByUsernameIgnoreCase(request.username())) {
			throw new NameTakenException("entity.user");
		}

		if (userRepository.existsByEmail(email)) {
			throw new NameTakenException("entity.user");
		}

		User user = userRepository.saveAndFlush(User.builder()
				.username(request.username().trim())
				.email(email)
				.role(request.role())
				.additionalPermissions(copyOf(request.additionalPermissions()))
				.isActive(true)
				.isEmailVerified(false)
				.build());

		emailVerificationService.issue(user);

		auditLogger.success(AuditEventType.USER_CREATION, user.getId(), "Account %s has been created with a role %s.", user.getUsername(), user.getRole());

		return AdminUserView.from(user, Instant.now());
	}


	/**
	 * Partial update - a {@code null} field is left alone.
	 */
	@Transactional
	public AdminUserView update(UUID id, UpdateUserRequest request) {
		User user = getUserOrThrow(id);
		boolean revokeSessions = false;

		if (request.username() != null) {
			revokeSessions |= changeUsername(user, request.username());
		}

		if (request.email() != null) {
			revokeSessions |= changeEmail(user, request.email());
		}

		if (request.role() != null && request.role() != user.getRole()) {
			guardSelfEdit(user, "error.cannot_change_own_role");
			guardLastAdmin(user, request.role(), user.isActive());

			auditLogger.success(AuditEventType.USER_MANAGEMENT, user.getId(), "Account's role changed from %s to %s.", user.getRole(), request.role());

			user.setRole(request.role());
			revokeSessions = true;
		}

		if (request.additionalPermissions() != null) {
			guardSelfEdit(user, "error.cannot_change_own_permissions");

			auditLogger.success(AuditEventType.USER_MANAGEMENT, user.getId(), "Account's additional permissions changed from %s to %s.", user.getAdditionalPermissions(), request.additionalPermissions());

			user.setAdditionalPermissions(copyOf(request.additionalPermissions()));
			revokeSessions = true;
		}

		if (request.active() != null && request.active() != user.isActive()) {
			if (!request.active()) {
				guardSelfEdit(user, "error.cannot_deactivate_self");
				guardLastAdmin(user, user.getRole(), false);
			}

			auditLogger.success(AuditEventType.USER_MANAGEMENT, user.getId(), "Account's isActive status changed from %s to %s.", user.isActive(), request.active());

			user.setActive(request.active());
			revokeSessions = true;
		}

		if (revokeSessions) {
			refreshTokenService.revokeAllForUser(user.getId());
		}

		return AdminUserView.from(user, Instant.now());
	}


	/**
	 * Ends a lockout early.
	 */
	@Transactional
	public AdminUserView unlock(UUID id) {
		User user = getUserOrThrow(id);

		accountLockService.reset(user);

		auditLogger.success(AuditEventType.USER_MANAGEMENT, user.getId(), "Account manually unlocked before the time limit.");

		return AdminUserView.from(user, Instant.now());
	}


	/**
	 * Sends a fresh verification link, ignoring the resend cooldown.
	 */
	@Transactional
	public void resendVerification(UUID id) {
		User user = getUserOrThrow(id);

		if (user.isEmailVerified()) {
			throw new InvalidOperationException("error.email_already_verified");
		}

		auditLogger.success(AuditEventType.EMAIL_VERIFICATION, user.getId(), "New verification link resent.");

		emailVerificationService.issue(user);
	}


	/**
	 * Signs somebody out everywhere, without touching anything else about their account.
	 */
	@Transactional
	public void forceLogout(UUID id) {
		User user = getUserOrThrow(id);

		refreshTokenService.revokeAllForUser(user.getId());

		auditLogger.success(AuditEventType.USER_MANAGEMENT, user.getId(), "Ended every session for account.");

		log.info("Ended every session for account {} at the request of {}", user.getId(), securityService.getCurrentUsername());
	}


	private boolean changeUsername(User user, String requested) {
		String username = requested.trim();

		if (username.equals(user.getUsername())) {
			return false;
		}

		if (userRepository.existsByUsernameIgnoreCase(username)) {
			throw new NameTakenException("entity.user");
		}

		auditLogger.success(AuditEventType.USER_MANAGEMENT, user.getId(), "Account's username changed from %s to %s.", user.getUsername(), username);

		user.setUsername(username);

		return true;
	}


	/**
	 * @return whether the address actually changed
	 */
	private boolean changeEmail(User user, String requested) {
		String email = User.normalizeEmail(requested);

		if (email.equals(user.getEmail())) {
			return false;
		}

		if (userRepository.existsByEmail(email)) {
			throw new NameTakenException("entity.user");
		}

		auditLogger.success(AuditEventType.USER_MANAGEMENT, user.getId(), "Account's email address changed from %s to %s; it must be verified again before sign-in works.", redact(user.getEmail()), redact(email));

		user.setEmail(email);
		user.setEmailVerified(false);

		emailVerificationService.issue(user);

		return true;
	}


	private void guardSelfEdit(User target, String messageKey) {
		if (target.getId().equals(securityService.getCurrentUserId())) {
			throw new InvalidOperationException(messageKey);
		}
	}


	/**
	 * Refuses any edit that would leave nobody able to administer the system.
	 */
	private void guardLastAdmin(User target, Role newRole, boolean stillActive) {
		boolean wasAdmin = target.getRole() == Role.ADMIN && target.isActive();
		boolean staysAdmin = newRole == Role.ADMIN && stillActive;

		if (!wasAdmin || staysAdmin) {
			return;
		}

		if (userRepository.countActiveByRoleExcluding(Role.ADMIN, target.getId()) == 0) {
			throw new InvalidOperationException("error.last_admin");
		}
	}


	private static Set<Permission> copyOf(Set<Permission> permissions) {
		if (permissions == null || permissions.isEmpty()) {
			return new HashSet<>();
		}

		return new HashSet<>(EnumSet.copyOf(permissions));
	}


	private static String redact(String email) {
		int at = email.indexOf('@');

		return at <= 1 ? "***" : email.charAt(0) + "***" + email.substring(at);
	}
}
