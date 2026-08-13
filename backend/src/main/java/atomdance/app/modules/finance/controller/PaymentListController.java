package atomdance.app.modules.finance.controller;

import atomdance.app.modules.finance.dto.CreateCustomListRequest;
import atomdance.app.modules.finance.dto.MonthSummaryView;
import atomdance.app.modules.finance.dto.PaymentListView;
import atomdance.app.modules.finance.service.ListSummaryService;
import atomdance.app.modules.finance.service.PaymentListService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class PaymentListController {

	private final PaymentListService paymentListService;
	private final ListSummaryService listSummaryService;

	@GetMapping
	@PreAuthorize("hasAuthority('READ_LISTS')")
	public List<PaymentListView> getAll() {
		return paymentListService.getAll();
	}

	@GetMapping("/summary/{year}")
	@PreAuthorize("hasAuthority('READ_LISTS')")
	public List<MonthSummaryView> summariseYear(@PathVariable int year) {
		return listSummaryService.summariseYear(year);
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('READ_LISTS')")
	public PaymentListView get(@PathVariable UUID id) {
		return paymentListService.get(id);
	}

	@GetMapping("/standard/{year}/{month}")
	@PreAuthorize("hasAuthority('READ_LISTS') and (!#create or hasAuthority('MODIFY_LISTS'))")
	public PaymentListView getStandard(@PathVariable int year, @PathVariable int month, @RequestParam(defaultValue = "false") boolean tournament, @RequestParam(defaultValue = "false") boolean create) {
		return paymentListService.getStandard(year, month, tournament, create);
	}

	@PostMapping("/custom")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_LISTS')")
	public PaymentListView createCustom(@RequestBody @Valid CreateCustomListRequest request) {
		return paymentListService.createCustom(request);
	}

	/**
	 * Replays how a custom list chose its people, adding anybody who now qualifies. Never removes.
	 */
	@PostMapping("/{id}/repopulate")
	@PreAuthorize("hasAuthority('MODIFY_LISTS')")
	public PaymentListView repopulate(@PathVariable UUID id) {
		return paymentListService.repopulate(id);
	}

	@PostMapping("/{id}/persons")
	@PreAuthorize("hasAuthority('MODIFY_LISTS')")
	public PaymentListView addPersons(@PathVariable UUID id, @RequestBody @NotEmpty(message = "At least one person is required") List<UUID> personIds) {
		return paymentListService.addPersons(id, personIds);
	}

	/**
	 * Rebuilds every amount from the current memberships and discount configuration. Needed after a group
	 * price change, a membership change, somebody moving between families, or a discount edit.
	 */
	@PostMapping("/{id}/recalculate")
	@PreAuthorize("hasAuthority('MODIFY_LISTS')")
	public PaymentListView recalculate(@PathVariable UUID id) {
		return paymentListService.recalculate(id);
	}

	/**
	 * Freezes the figures for the accountants.
	 */
	@PostMapping("/{id}/close")
	@PreAuthorize("hasAuthority('CLOSE_LISTS')")
	public PaymentListView close(@PathVariable UUID id) {
		return paymentListService.close(id);
	}

	@PostMapping("/{id}/reopen")
	@PreAuthorize("hasAuthority('CLOSE_LISTS')")
	public PaymentListView reopen(@PathVariable UUID id) {
		return paymentListService.reopen(id);
	}

	/**
	 * Only for a list created by mistake: refused once closed or once any money has been recorded on it.
	 */
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_LISTS')")
	public void delete(@PathVariable UUID id) {
		paymentListService.delete(id);
	}
}
