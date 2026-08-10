package atomdance.app.modules.finance.controller;

import atomdance.app.modules.finance.dto.*;
import atomdance.app.modules.finance.service.OverpaymentService;
import atomdance.app.modules.finance.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService paymentService;
	private final OverpaymentService overpaymentService;

	/**
	 * Breakdowns are omitted here - fetch a single payment to see how its total was arrived at.
	 */
	@GetMapping("/lists/{listId}/payments")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public List<PaymentView> listForList(@PathVariable UUID listId) {
		return paymentService.getForList(listId);
	}

	@GetMapping("/payments/{id}")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public PaymentView get(@PathVariable UUID id) {
		return paymentService.get(id);
	}

	@GetMapping("/payments/by-code/{code}")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public PaymentView getByCode(@PathVariable String code) {
		return paymentService.getByCode(code);
	}

	@PatchMapping("/payments/{id}")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView update(@PathVariable UUID id, @RequestBody @Valid UpdatePaymentRequest request) {
		return paymentService.update(id, request);
	}

	@PostMapping("/payments/{id}/record-payment")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView recordPayment(@PathVariable UUID id, @RequestBody @Valid RecordPaymentRequest request) {
		return paymentService.recordPayment(id, request);
	}

	/**
	 * Adds a charge for this month only.
	 */
	@PostMapping("/payments/{id}/lines")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView addLine(@PathVariable UUID id, @RequestBody @Valid SaveOneTimeLineRequest request) {
		return paymentService.addOneTimeLine(id, request);
	}

	/**
	 * Sets how many classes somebody attended, for a per-class group.
	 */
	@PatchMapping("/payments/{id}/lines/{lineId}")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView updateLineQuantity(@PathVariable UUID id, @PathVariable UUID lineId, @RequestBody @Valid UpdateLineQuantityRequest request) {
		return paymentService.updateLineQuantity(id, lineId, request);
	}

	@DeleteMapping("/payments/{id}/lines/{lineId}")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView deleteLine(@PathVariable UUID id, @PathVariable UUID lineId) {
		return paymentService.deleteLine(id, lineId);
	}

	/**
	 * The months this payment's overpayment could settle: arrears first, oldest first, and future months only when no past debt is left.
	 * Future months with no list yet are included - assigning to one creates it.
	 */
	@GetMapping("/payments/{id}/overpayment-candidates")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public OverpaymentOptionsView overpaymentCandidates(@PathVariable UUID id) {
		return overpaymentService.candidates(id);
	}

	/**
	 * Marks the chosen months as settled from this payment's overpayment.
	 * The money itself stays here. Each chosen month gets a row flagged as a fake payment, which reads as settled but is left out of every total.
	 */
	@PostMapping("/payments/{id}/allocate-overpayment")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView allocateOverpayment(@PathVariable UUID id, @RequestBody @Valid AllocateOverpaymentRequest request) {
		return overpaymentService.allocate(id, request);
	}

	/**
	 * Undoes an assignment, leaving that month owing again and returning the money to the payment it came from.
	 */
	@DeleteMapping("/payments/{id}/allocation")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView removeAllocation(@PathVariable UUID id) {
		return overpaymentService.removeAllocation(id);
	}
}
