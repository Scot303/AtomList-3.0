package atomdance.app.modules.group.controller;

import atomdance.app.modules.group.dto.CreateMembershipRequest;
import atomdance.app.modules.group.dto.MembershipView;
import atomdance.app.modules.group.dto.UpdateMembershipRequest;
import atomdance.app.modules.group.service.MembershipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MembershipController {

	private final MembershipService membershipService;

	@GetMapping("/api/persons/{personId}/memberships")
	@PreAuthorize("hasAuthority('READ_PERSONS')")
	public List<MembershipView> listForPerson(@PathVariable UUID personId) {
		return membershipService.getAllForPerson(personId);
	}

	@PostMapping("/api/persons/{personId}/memberships")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_PERSONS')")
	public MembershipView create(@PathVariable UUID personId, @RequestBody @Valid CreateMembershipRequest request) {
		return membershipService.create(personId, request);
	}

	/**
	 * Changing a cost here shifts the family discount order, so recalculate any open list afterwards.
	 */
	@PatchMapping("/api/memberships/{id}")
	@PreAuthorize("hasAuthority('MODIFY_PERSONS')")
	public MembershipView update(@PathVariable UUID id, @RequestBody @Valid UpdateMembershipRequest request) {
		return membershipService.update(id, request);
	}

	/**
	 * Ends the membership without removing it, so past lists keep explaining their own figures.
	 */
	@PostMapping("/api/memberships/{id}/leave")
	@PreAuthorize("hasAuthority('MODIFY_PERSONS')")
	public MembershipView leave(@PathVariable UUID id, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate leftAt) {
		return membershipService.leave(id, leftAt);
	}

	@DeleteMapping("/api/memberships/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_PERSONS')")
	public void delete(@PathVariable UUID id) {
		membershipService.delete(id);
	}
}