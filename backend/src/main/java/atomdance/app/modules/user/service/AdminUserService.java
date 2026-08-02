package atomdance.app.modules.user.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NameTakenException;
import atomdance.app.modules.activity.model.ActivityStatus;
import atomdance.app.modules.activity.model.ActivityType;
import atomdance.app.modules.activity.service.UserActivityLogger;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

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
	private final UserActivityLogger activityLogger;


	private User getUserOrThrow(UUID id) {
		return userRepository.findByIdWithPermissions(id)
				.orElseThrow(() -> new UserNotFoundException(id.toString()));
	}

	@Transactional(readOnly = true)
	public Page<AdminUserView> list(Pageable pageable) {
		Instant now = Instant.now();

		return userRepository.findAll(pageable).map(user -> AdminUserView.from(user, now));
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
		activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.USER_CREATION, ActivityStatus.SUCCESS, String.format("Account %s has been created with a role %s.", user.getUsername(), user.getRole()));

		return AdminUserView.from(user, Instant.now());
	}

	/**
	 * Partial update - a {@code null} field is left alone.
	 */
	@Transactional
	public AdminUserView update(UUID id, UpdateUserRequest request) {
		User user = getUserOrThrow(id);
		boolean revokeSessions = false;

		if (request.email() != null) {
			revokeSessions |= changeEmail(user, request.email());
		}

		if (request.role() != null && request.role() != user.getRole()) {
			guardSelfEdit(user, "error.cannot_change_own_role");
			guardLastAdmin(user, request.role(), user.isActive());

			log.info("Changing the role on account {} from {} to {}", user.getId(), user.getRole(), request.role());
			activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.USER_MANAGEMENT, ActivityStatus.SUCCESS, String.format("Account's role changed to %s.", request.role()));

			user.setRole(request.role());
			revokeSessions = true;
		}

		if (request.additionalPermissions() != null) {
			guardSelfEdit(user, "error.cannot_change_own_permissions");

			log.info("Changed the additional permissions on account {} from {} to {}", user.getId(), user.getAdditionalPermissions(), request.additionalPermissions());
			activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.USER_MANAGEMENT, ActivityStatus.SUCCESS, String.format("Account's additional permissions changed to %s.", request.additionalPermissions()));

			user.setAdditionalPermissions(copyOf(request.additionalPermissions()));
			revokeSessions = true;
		}

		if (request.active() != null && request.active() != user.isActive()) {
			if (!request.active()) {
				guardSelfEdit(user, "error.cannot_deactivate_self");
				guardLastAdmin(user, user.getRole(), false);
			}

			log.info("Changed isActive status on account {} from {} to {}", user.getId(), user.isActive(), request.active());
			activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.USER_MANAGEMENT, ActivityStatus.SUCCESS, String.format("Account's isActive status changed to %s.", request.active()));

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
		activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.USER_MANAGEMENT, ActivityStatus.SUCCESS, "Account manually unlocked before time limit.");

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

		activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.EMAIL_VERIFICATION, ActivityStatus.SUCCESS, "New verification link resent.");

		emailVerificationService.issue(user);
	}

	/**
	 * Signs somebody out everywhere, without touching anything else about their account.
	 */
	@Transactional
	public void forceLogout(UUID id) {
		User user = getUserOrThrow(id);

		refreshTokenService.revokeAllForUser(user.getId());

		activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.USER_MANAGEMENT, ActivityStatus.SUCCESS, "Ended every session for account.");

		log.info("Ended every session for account {} at the request of {}", user.getId(), securityService.getCurrentUsername());
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
		activityLogger.recordOnCommit(securityService.getCurrentUserId(), user.getId(), ActivityType.USER_MANAGEMENT, ActivityStatus.SUCCESS, String.format("Account's address email changed to %s.", email));

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
