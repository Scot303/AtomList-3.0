package atomdance.app.modules.user.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NameTakenException;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
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

		log.info("Created account {} ({}) with role {}", user.getId(), user.getUsername(), user.getRole());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_CREATION, AuditOutcome.SUCCESS, String.format("Account %s has been created with a role %s.", user.getUsername(), user.getRole()));

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

			log.info("Changing the role on account {} from {} to {}", user.getId(), user.getRole(), request.role());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Account's role changed to %s.", request.role()));

			user.setRole(request.role());
			revokeSessions = true;
		}

		if (request.additionalPermissions() != null) {
			guardSelfEdit(user, "error.cannot_change_own_permissions");

			log.info("Changed the additional permissions on account {} from {} to {}", user.getId(), user.getAdditionalPermissions(), request.additionalPermissions());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Account's additional permissions changed to %s.", request.additionalPermissions()));

			user.setAdditionalPermissions(copyOf(request.additionalPermissions()));
			revokeSessions = true;
		}

		if (request.active() != null && request.active() != user.isActive()) {
			if (!request.active()) {
				guardSelfEdit(user, "error.cannot_deactivate_self");
				guardLastAdmin(user, user.getRole(), false);
			}

			log.info("Changed isActive status on account {} from {} to {}", user.getId(), user.isActive(), request.active());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Account's isActive status changed to %s.", request.active()));

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

		log.info("Account manually {} unlocked by {}", user.getId(), securityService.getCurrentUsername());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_MANAGEMENT, AuditOutcome.SUCCESS, "Account manually unlocked before time limit.");

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

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.EMAIL_VERIFICATION, AuditOutcome.SUCCESS, "New verification link resent.");

		emailVerificationService.issue(user);
	}

	/**
	 * Signs somebody out everywhere, without touching anything else about their account.
	 */
	@Transactional
	public void forceLogout(UUID id) {
		User user = getUserOrThrow(id);

		refreshTokenService.revokeAllForUser(user.getId());

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_MANAGEMENT, AuditOutcome.SUCCESS, "Ended every session for account.");

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

		log.info("Changing the username on account {} from {} to {}", user.getId(), user.getUsername(), username);
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Account's username changed to %s.", username));

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

		log.info("Changing the address on account {} - it must be verified again before sign-in works", user.getId());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), AuditEventType.USER_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Account's address email changed to %s.", email));

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
}
