package atomdance.app.modules.finance.paymentList.controller;

import atomdance.app.modules.finance.deposit.dto.CreditSweepResultView;
import atomdance.app.modules.finance.deposit.dto.CreditSweepView;
import atomdance.app.modules.finance.deposit.dto.SettleCreditRequest;
import atomdance.app.modules.finance.deposit.service.CreditSweepService;
import atomdance.app.modules.finance.paymentList.dto.*;
import atomdance.app.modules.finance.paymentList.service.ListReportService;
import atomdance.app.modules.finance.paymentList.service.ListSummaryService;
import atomdance.app.modules.finance.paymentList.service.PaymentListService;
import jakarta.validation.Valid;
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
	private final ListReportService listReportService;
	private final CreditSweepService creditSweepService;
	private final PaymentSpreadsheetService paymentSpreadsheetService;


	@GetMapping
	@PreAuthorize("hasAuthority('READ_LISTS')")
	public List<PaymentListView> getAll() {
		return paymentListService.getAll();
	}


	@GetMapping("/custom")
	@PreAuthorize("hasAuthority('READ_LISTS')")
	public List<PaymentListView> getCustom() {
		return paymentListService.getCustom();
	}


	/**
	 * One season of monthly sheets: September of {@code startYear} through to August of the year after it, in that order.
	 */
	@GetMapping("/summary/{startYear}")
	@PreAuthorize("hasAuthority('READ_LISTS')")
	public List<MonthSummaryView> summariseSeason(@PathVariable int startYear) {
		return listSummaryService.summariseSeason(startYear);
	}


	@GetMapping("/{id}")
	@PreAuthorize("hasAuthority('READ_LISTS')")
	public PaymentListView get(@PathVariable UUID id) {
		return paymentListService.get(id);
	}


	/**
	 * Everything this list would say on paper: every charge with the instalments that settled it, the money taken
	 * in for the period and where it went, and the totals underneath.
	 */
	@GetMapping("/{id}/report")
	@PreAuthorize("hasAuthority('READ_LISTS') and hasAuthority('READ_PAYMENTS')")
	public ListReportView report(@PathVariable UUID id) {
		return listReportService.build(id);
	}

	@GetMapping("{id}/spreadsheet")
	@PreAuthorize("hasAuthority('READ_LISTS') and hasAuthority('READ_PAYMENTS')")
	public byte[] reportSpreadsheet(@PathVariable UUID id) {
		return paymentSpreadsheetService.getPaymentSpreadsheet(id);
	}

	/**
	 * Every bit of leftover credit that could be spent on this list, and what each bit would settle here.
	 */
	@GetMapping("/{id}/overpayments")
	@PreAuthorize("hasAuthority('READ_LISTS') and hasAuthority('READ_PAYMENTS')")
	public CreditSweepView overpayments(@PathVariable UUID id) {
		return creditSweepService.preview(id);
	}


	/**
	 * Spends that credit, settling what the manager approved.
	 * <p>
	 * Send the plan back as {@code expected} and the server works it out again and compares before writing anything, so
	 * a charge somebody else settled in the meantime is reported rather than quietly changing what this money covers.
	 */
	@PostMapping("/{id}/overpayments/settle")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public CreditSweepResultView settleOverpayments(@PathVariable UUID id, @RequestBody @Valid SettleCreditRequest request) {
		return creditSweepService.apply(id, request);
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


	@PatchMapping("/{id}")
	@PreAuthorize("hasAuthority('MODIFY_LISTS')")
	public PaymentListView updateCustom(@PathVariable UUID id, @RequestBody @Valid UpdateCustomListRequest request) {
		return paymentListService.updateCustom(id, request);
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
	public PaymentListView addPersons(@PathVariable UUID id, @RequestBody @Valid AddPersonsRequest request) {
		return paymentListService.addPersons(id, request);
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
