package atomdance.app.modules.user.controller;

import atomdance.app.modules.user.dto.AdminUserView;
import atomdance.app.modules.user.dto.CreateUserRequest;
import atomdance.app.modules.user.dto.UpdateUserRequest;
import atomdance.app.modules.user.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Account administration service.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_USERS')")
public class AdminUserController {

	private final AdminUserService adminUserService;

	@GetMapping
	public PagedModel<AdminUserView> getAll(@PageableDefault(size = 50, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
		return new PagedModel<>(adminUserService.getAll(pageable));
	}

	@GetMapping("/{id}")
	public AdminUserView get(@PathVariable UUID id) {
		return adminUserService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AdminUserView create(@RequestBody @Valid CreateUserRequest request) {
		return adminUserService.create(request);
	}

	@PatchMapping("/{id}")
	public AdminUserView update(@PathVariable UUID id, @RequestBody @Valid UpdateUserRequest request) {
		return adminUserService.update(id, request);
	}

	/**
	 * Clears a lockout immediately instead of making the user sit out the remaining time.
	 */
	@PostMapping("/{id}/unlock")
	public AdminUserView unlock(@PathVariable UUID id) {
		return adminUserService.unlock(id);
	}

	@PostMapping("/{id}/resend-verification")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public void resendVerification(@PathVariable UUID id) {
		adminUserService.resendVerification(id);
	}

	/**
	 * Ends every session the account holds without otherwise changing it.
	 */
	@PostMapping("/{id}/force-logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void forceLogout(@PathVariable UUID id) {
		adminUserService.forceLogout(id);
	}
}
