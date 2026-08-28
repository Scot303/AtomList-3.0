package atomdance.app.modules.finance.transaction.service;

import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.paymentList.model.PaymentList;
import atomdance.app.modules.finance.paymentList.service.PaymentListService;
import atomdance.app.modules.finance.transaction.dto.CreateTransactionRequest;
import atomdance.app.modules.finance.transaction.dto.SeedInstructorExpensesRequest;
import atomdance.app.modules.finance.transaction.dto.TransactionView;
import atomdance.app.modules.finance.transaction.dto.UpdateTransactionRequest;
import atomdance.app.modules.finance.transaction.model.Transaction;
import atomdance.app.modules.finance.transaction.model.TransactionType;
import atomdance.app.modules.finance.transaction.repository.TransactionRepository;
import atomdance.app.modules.instructor.model.Instructor;
import atomdance.app.modules.instructor.service.InstructorService;
import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;


@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionService {

	private final TransactionRepository transactionRepository;
	private final PaymentListService paymentListService;
	private final InstructorExpenseService instructorExpenseService;
	private final InstructorService instructorService;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;


	@Transactional(readOnly = true)
	public List<TransactionView> getAllForList(UUID listId) {
		paymentListService.getOrThrow(listId);

		Set<TransactionType> readable = readableTypes();

		if (readable.isEmpty()) {
			throw new AccessDeniedException("Missing authority to read transactions of any type");
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), listId, AuditEventType.TRANSACTION_PREVIEW, AuditOutcome.SUCCESS, "Previewed transactions for list");
		return transactionRepository.findByListIdAndTypeIn(listId, readable).stream().map(TransactionView::from).toList();
	}


	@Transactional
	public TransactionView create(UUID listId, CreateTransactionRequest request) {
		PaymentList list = paymentListService.getOrThrow(listId);
		list.assertOpen();

		securityService.requirePermission(request.type().modifyPermission());

		Instructor instructor = request.instructorId() == null ? null : instructorService.getOrThrow(request.instructorId());

		if (instructor != null && request.type() != TransactionType.EXPENSE) {
			throw new InvalidOperationException("error.instructor_on_income_transaction");
		}

		Transaction transaction = transactionRepository.saveAndFlush(Transaction.builder()
				.list(list)
				.name(request.name().trim())
				.type(request.type())
				.amount(Money.normalize(request.amount()))
				.quantity(request.quantity() != null ? Money.normalize(request.quantity()) : BigDecimal.ONE)
				.invoiceNumber(request.invoiceNumber())
				.instructor(instructor)
				.note(request.note())
				.build());

		log.info("Created {} transaction {} of {} on list {}", transaction.getType(), transaction.getId(), transaction.getTotal(), listId);
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), transaction.getId(), AuditEventType.TRANSACTION_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s transaction of %s added to list %s.", transaction.getType(), transaction.getTotal(), PaymentListService.describeList(list)));

		return TransactionView.from(transaction);
	}


	@Transactional
	public TransactionView update(UUID id, UpdateTransactionRequest request) {
		Transaction transaction = getOrThrow(id);
		transaction.getList().assertOpen();

		securityService.requirePermission(transaction.getType().modifyPermission());

		if (request.name() != null) {
			transaction.setName(request.name().trim());
		}

		if (request.amount() != null) {
			transaction.setAmount(Money.normalize(request.amount()));
		}

		if (request.quantity() != null) {
			transaction.setQuantity(Money.normalize(request.quantity()));
		}

		if (request.invoiceNumber() != null) {
			transaction.setInvoiceNumber(request.invoiceNumber());
		}

		if (request.note() != null) {
			transaction.setNote(request.note());
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), transaction.getId(), AuditEventType.TRANSACTION_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s transaction on list %s updated.", transaction.getType(), PaymentListService.describeList(transaction.getList())));

		return TransactionView.from(transaction);
	}


	@Transactional
	public void delete(UUID id) {
		Transaction transaction = getOrThrow(id);
		transaction.getList().assertOpen();

		securityService.requirePermission(transaction.getType().modifyPermission());

		transactionRepository.delete(transaction);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), id, AuditEventType.TRANSACTION_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%s transaction of %s removed from list %s.", transaction.getType(), transaction.getTotal(), PaymentListService.describeList(transaction.getList())));
	}


	/**
	 * Adds instructors to a list as expense rows with zero hours.
	 */
	@Transactional
	public List<TransactionView> seedInstructorExpenses(UUID listId, SeedInstructorExpensesRequest request) {
		PaymentList list = paymentListService.getOrThrow(listId);
		list.assertOpen();

		securityService.requirePermission(Permission.MODIFY_EXPENSE_TRANSACTIONS);

		boolean named = request != null && request.instructorIds() != null && !request.instructorIds().isEmpty();

		if (!named) {
			throw new InvalidOperationException("error.instructors_must_be_named");
		}

		List<Instructor> instructors = instructorService.findAllOrThrow(request.instructorIds()).stream().filter(Instructor::isActive).toList();

		int created = instructorExpenseService.seed(list, instructors);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), list.getId(), AuditEventType.TRANSACTION_MANAGEMENT, AuditOutcome.SUCCESS, String.format("%d instructor expense row(s) added to list %s.", created, PaymentListService.describeList(list)));

		return getAllForList(listId);
	}


	private Transaction getOrThrow(UUID id) {
		return transactionRepository.findByIdWithRelations(id)
				.orElseThrow(() -> new NotFoundException("entity.transaction"));
	}


	private Set<TransactionType> readableTypes() {
		Set<TransactionType> readable = EnumSet.noneOf(TransactionType.class);

		for (TransactionType type : TransactionType.values()) {
			if (securityService.hasPermission(type.readPermission())) {
				readable.add(type);
			}
		}

		return readable;
	}
}
