package atomdance.app.modules.group.controller;

import atomdance.app.modules.group.dto.CreateGroupRequest;
import atomdance.app.modules.group.dto.GroupView;
import atomdance.app.modules.group.dto.UpdateGroupRequest;
import atomdance.app.modules.group.service.GroupService;
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

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

	private final GroupService groupService;

	@GetMapping
	@PreAuthorize("hasAuthority('READ_GROUPS')")
	public PagedModel<GroupView> getAll(@RequestParam(required = false) String search, @RequestParam(defaultValue = "false") boolean activeOnly, @PageableDefault(size = 100, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
		return new PagedModel<>(groupService.getAll(search, activeOnly, pageable));
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
