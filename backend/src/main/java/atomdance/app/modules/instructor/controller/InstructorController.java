package atomdance.app.modules.instructor.controller;

import atomdance.app.modules.instructor.dto.CreateInstructorRequest;
import atomdance.app.modules.instructor.dto.InstructorView;
import atomdance.app.modules.instructor.dto.UpdateInstructorRequest;
import atomdance.app.modules.instructor.service.InstructorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/instructors")
@RequiredArgsConstructor
public class InstructorController {

	private final InstructorService instructorService;

	@GetMapping
	@PreAuthorize("hasAuthority('READ_INSTRUCTORS')")
	public List<InstructorView> getAll() {
		return instructorService.getAll();
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('READ_INSTRUCTORS')")
	public InstructorView get(@PathVariable UUID id) {
		return instructorService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_INSTRUCTORS')")
	public InstructorView create(@RequestBody @Valid CreateInstructorRequest request) {
		return instructorService.create(request);
	}

	@PatchMapping("/{id}")
	@PreAuthorize("hasAuthority('MODIFY_INSTRUCTORS')")
	public InstructorView update(@PathVariable UUID id, @RequestBody @Valid UpdateInstructorRequest request) {
		return instructorService.update(id, request);
	}

	/**
	 * Only possible while the instructor appears on no list. Deactivate instead.
	 */
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_INSTRUCTORS')")
	public void delete(@PathVariable UUID id) {
		instructorService.delete(id);
	}
}
