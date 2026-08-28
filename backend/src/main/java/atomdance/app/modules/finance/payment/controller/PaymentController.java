package atomdance.app.modules.finance.payment.controller;

import atomdance.app.modules.finance.deposit.dto.SettleDirectRequest;
import atomdance.app.modules.finance.deposit.service.DepositService;
import atomdance.app.modules.finance.payment.dto.PaymentView;
import atomdance.app.modules.finance.payment.dto.SaveOneOffPaymentRequest;
import atomdance.app.modules.finance.payment.dto.UpdatePaymentRequest;
import atomdance.app.modules.finance.payment.dto.UpdateQuantityRequest;
import atomdance.app.modules.finance.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;


/**
 * The charge side of a list: what each person owes for each of their groups.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService paymentService;
	private final DepositService depositService;


	/**
	 * How each payment was settled is omitted here - fetch a single payment for its instalments.
	 */
	@GetMapping("/lists/{listId}/payments")
	@PreAuthorize("hasAuthority('READ_PAYMENTS')")
	public List<PaymentView> getAllForList(@PathVariable UUID listId) {
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


	/**
	 * Records money handed over for this one charge.
	 */
	@PostMapping("/payments/{id}/settle")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView settle(@PathVariable UUID id, @RequestBody @Valid SettleDirectRequest request) {
		return depositService.settleDirect(id, request);
	}


	/**
	 * Adds a charge for this list only, belonging to no group.
	 */
	@PostMapping("/lists/{listId}/payments")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView addOneOff(@PathVariable UUID listId, @RequestBody @Valid SaveOneOffPaymentRequest request) {
		return paymentService.addOneOff(listId, request);
	}


	@PutMapping("/payments/{id}")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView updateOneOff(@PathVariable UUID id, @RequestBody @Valid SaveOneOffPaymentRequest request) {
		return paymentService.updateOneOff(id, request);
	}


	/**
	 * Sets how many classes somebody attended, for a per-class group.
	 */
	@PatchMapping("/payments/{id}/quantity")
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public PaymentView updateQuantity(@PathVariable UUID id, @RequestBody @Valid UpdateQuantityRequest request) {
		return paymentService.updateQuantity(id, request);
	}


	@DeleteMapping("/payments/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAuthority('MODIFY_PAYMENTS')")
	public void deleteOneOff(@PathVariable UUID id) {
		paymentService.deleteOneOff(id);
	}
}
