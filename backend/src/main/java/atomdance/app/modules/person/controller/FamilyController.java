package atomdance.app.modules.person.controller;

import atomdance.app.modules.person.dto.CreateFamilyRequest;
import atomdance.app.modules.person.dto.FamilyView;
import atomdance.app.modules.person.dto.UpdateFamilyRequest;
import atomdance.app.modules.person.service.FamilyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/families")
@RequiredArgsConstructor
public class FamilyController {

	private final FamilyService familyService;

	@GetMapping
	@PreAuthorize("hasAuthority('READ_FAMILIES')")
	public List<FamilyView> getAll() {
		return familyService.getAll();
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('READ_FAMILIES')")
	public FamilyView get(@PathVariable UUID id) {
		return familyService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public FamilyView create(@RequestBody @Valid CreateFamilyRequest request) {
		return familyService.create(request);
	}

	@PatchMapping("/{id}")
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public FamilyView update(@PathVariable UUID id, @RequestBody @Valid UpdateFamilyRequest request) {
		return familyService.update(id, request);
	}

	@PostMapping("/{id}/members")
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public FamilyView addMembers(@PathVariable UUID id, @RequestBody @NotEmpty(message = "At least one person is required") List<UUID> personIds) {
		return familyService.addMembers(id, personIds);
	}

	@DeleteMapping("/{id}/members/{personId}")
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public FamilyView removeMember(@PathVariable UUID id, @PathVariable UUID personId) {
		return familyService.removeMember(id, personId);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public void delete(@PathVariable UUID id) {
		familyService.delete(id);
	}
}
