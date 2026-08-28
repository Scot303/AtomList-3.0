package atomdance.app.modules.finance.transaction.dto;

import atomdance.app.modules.finance.transaction.model.Transaction;
import atomdance.app.modules.finance.transaction.model.TransactionType;

import java.math.BigDecimal;
import java.util.UUID;


public record TransactionView(
		UUID id,
		UUID listId,
		String name,
		TransactionType type,
		BigDecimal amount,
		BigDecimal quantity,
		BigDecimal total,
		String invoiceNumber,
		UUID instructorId,
		String instructorName,
		String note
) {

	public static TransactionView from(Transaction transaction) {
		return new TransactionView(
				transaction.getId(),
				transaction.getList().getId(),
				transaction.getName(),
				transaction.getType(),
				transaction.getAmount(),
				transaction.getQuantity(),
				transaction.getTotal(),
				transaction.getInvoiceNumber(),
				transaction.getInstructor() == null ? null : transaction.getInstructor().getId(),
				transaction.getInstructor() == null ? null : transaction.getInstructor().getFullName(),
				transaction.getNote()
		);
	}
}
