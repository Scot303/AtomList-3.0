package atomdance.app.modules.person.controller;

import atomdance.app.modules.person.dto.CreatePersonRequest;
import atomdance.app.modules.person.dto.PersonView;
import atomdance.app.modules.person.dto.UpdatePersonRequest;
import atomdance.app.modules.person.service.PersonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/persons")
@RequiredArgsConstructor
public class PersonController {

	private final PersonService personService;

	@GetMapping
	@PreAuthorize("hasAuthority('READ_PERSONS')")
	public List<PersonView> getAll() {
		return personService.getAll();
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('READ_PERSONS')")
	public PersonView get(@PathVariable UUID id) {
		return personService.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_PERSONS')")
	public PersonView create(@RequestBody @Valid CreatePersonRequest request) {
		return personService.create(request);
	}

	@PatchMapping("/{id}")
	@PreAuthorize("hasAuthority('MODIFY_PERSONS')")
	public PersonView update(@PathVariable UUID id, @RequestBody @Valid UpdatePersonRequest request) {
		return personService.update(id, request);
	}

}
