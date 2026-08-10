package atomdance.app.modules.person.controller;

import atomdance.app.modules.person.dto.CreateUpdateFamilyRequest;
import atomdance.app.modules.person.dto.FamilyView;
import atomdance.app.modules.person.service.FamilyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
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
	public FamilyView create(@RequestBody @Valid CreateUpdateFamilyRequest request) {
		return familyService.create(request);
	}

	@PatchMapping("/{id}")
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public FamilyView update(@PathVariable UUID id, @RequestBody @Valid CreateUpdateFamilyRequest request) {
		return familyService.update(id, request);
	}

	@PutMapping("/{id}/members")
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public FamilyView setMembers(@PathVariable UUID id, @RequestBody @NotNull(message = "A list of members is required") List<UUID> personIds) {
		return familyService.setMembers(id, personIds);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_FAMILIES')")
	public void delete(@PathVariable UUID id) {
		familyService.delete(id);
	}
}
