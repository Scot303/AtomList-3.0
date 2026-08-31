package atomdance.app.modules.group.controller;

import atomdance.app.modules.group.dto.CreateGroupRequest;
import atomdance.app.modules.group.dto.GroupView;
import atomdance.app.modules.group.dto.UpdateGroupRequest;
import atomdance.app.modules.group.service.GroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

	private final GroupService groupService;

	@GetMapping
	@PreAuthorize("hasAuthority('READ_GROUPS')")
	public List<GroupView> getAll() {
		return groupService.getAll();
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('READ_GROUPS')")
	public GroupView get(@PathVariable UUID id) {
		return groupService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_GROUPS')")
	public GroupView create(@RequestBody @Valid CreateGroupRequest request) {
		return groupService.create(request);
	}

	@PatchMapping("/{id}")
	@PreAuthorize("hasAuthority('MODIFY_GROUPS')")
	public GroupView update(@PathVariable UUID id, @RequestBody @Valid UpdateGroupRequest request) {
		return groupService.update(id, request);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_GROUPS')")
	public void delete(@PathVariable UUID id) {
		groupService.delete(id);
	}
}
