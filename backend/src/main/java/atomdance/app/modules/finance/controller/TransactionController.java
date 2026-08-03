package atomdance.app.modules.finance.controller;

import atomdance.app.modules.finance.dto.CreateTransactionRequest;
import atomdance.app.modules.finance.dto.SeedInstructorExpensesRequest;
import atomdance.app.modules.finance.dto.TransactionView;
import atomdance.app.modules.finance.dto.UpdateTransactionRequest;
import atomdance.app.modules.finance.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Income and expense rows on a list.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TransactionController {

	private final TransactionService transactionService;

	/**
	 * Returns only the kinds the caller may read. Somebody with income permissions alone sees the income rows and no sign that any expenses exist.
	 */
	@GetMapping("/lists/{listId}/transactions")
	@PreAuthorize("hasAnyAuthority('READ_INCOME_TRANSACTIONS', 'READ_EXPENSE_TRANSACTIONS')")
	public List<TransactionView> listForList(@PathVariable UUID listId) {
		return transactionService.getAllForList(listId);
	}

	/**
	 * The type in the body decides which permission is required.
	 */
	@PostMapping("/lists/{listId}/transactions")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasAnyAuthority('MODIFY_INCOME_TRANSACTIONS', 'MODIFY_EXPENSE_TRANSACTIONS')")
	public TransactionView create(@PathVariable UUID listId, @RequestBody @Valid CreateTransactionRequest request) {
		return transactionService.create(listId, request);
	}

	@PatchMapping("/transactions/{id}")
	@PreAuthorize("hasAnyAuthority('MODIFY_INCOME_TRANSACTIONS', 'MODIFY_EXPENSE_TRANSACTIONS')")
	public TransactionView update(@PathVariable UUID id, @RequestBody @Valid UpdateTransactionRequest request) {
		return transactionService.update(id, request);
	}

	@DeleteMapping("/transactions/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasAnyAuthority('MODIFY_INCOME_TRANSACTIONS', 'MODIFY_EXPENSE_TRANSACTIONS')")
	public void delete(@PathVariable UUID id) {
		transactionService.delete(id);
	}

	/**
	 * Adds instructors as expense rows with their hours at zero.
	 */
	@PostMapping("/lists/{listId}/instructor-expenses")
	@PreAuthorize("hasAuthority('MODIFY_EXPENSE_TRANSACTIONS')")
	public List<TransactionView> seedInstructorExpenses(@PathVariable UUID listId, @RequestBody(required = false) SeedInstructorExpensesRequest request) {
		return transactionService.seedInstructorExpenses(listId, request);
	}
}
