package atomdance.app.modules.finance.controller;

import atomdance.app.modules.finance.dto.*;
import atomdance.app.modules.finance.service.DepositService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


@RestController
@RequestMapping("/api/deposits")
@RequiredArgsConstructor
public class DepositController {

	private final DepositService depositService;


	@PostMapping("/plan")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public DepositPlanView plan(@RequestBody @Valid PlanDepositRequest request) {
		return depositService.plan(request);
	}


	/**
	 * Records the money and settles what the plan proposed.
	 * <p>
	 * Send the plan back as {@code expected} and the server checks it still holds before writing anything, so a
	 * debt somebody else settled in the meantime is reported instead of quietly changing what this money covers.
	 */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public DepositView create(@RequestBody @Valid CreateDepositRequest request) {
		return depositService.create(request);
	}


	@GetMapping
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public List<DepositView> getHistory(@RequestParam(required = false) Integer year) {
		return depositService.getHistory(year);
	}


	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public DepositView get(@PathVariable UUID id) {
		return depositService.get(id);
	}


	@GetMapping("/by-code/{code}")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public DepositView getByCode(@PathVariable String code) {
		return depositService.getByCode(code);
	}


	/**
	 * Credit somebody has left over from earlier handovers.
	 */
	@GetMapping("/credit/{personId}")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public List<DepositView> getCredit(@PathVariable UUID personId) {
		return depositService.getCreditFor(personId);
	}


	/**
	 * Spends what is left of a deposit: against the payments named, or wherever a fresh plan would put it.
	 */
	@PostMapping("/{id}/allocate")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public DepositView allocate(@PathVariable UUID id, @RequestBody @Valid AllocateDepositRequest request) {
		return depositService.allocate(id, request);
	}


	/**
	 * Undoes one allocation, leaving that debt owing again and returning the money to this deposit's credit.
	 * <p>
	 * Refused for money counted on a list that has since been closed: that figure has been sent to the accountants and must not move.
	 */
	@DeleteMapping("/{id}/settlements/{settlementId}")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public DepositView removeSettlement(@PathVariable UUID id, @PathVariable UUID settlementId) {
		return depositService.removeSettlement(id, settlementId);
	}


	/**
	 * Only for a handover recorded by mistake: refused while any of it is still settling something.
	 */
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public void delete(@PathVariable UUID id) {
		depositService.delete(id);
	}
}
