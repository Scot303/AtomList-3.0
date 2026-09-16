package atomdance.app.modules.finance.paymentList.service;

import atomdance.app.modules.attendance.model.GenResultPayload;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.repository.PaymentRepository;
import atomdance.app.modules.finance.paymentList.model.PaymentList;
import atomdance.app.modules.finance.paymentList.service.financesheet.FinanceSheetGenerator;
import atomdance.app.modules.finance.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class FinanceSheetService {

	private final ListReportService listReportService;
	private final FinanceSheetGenerator financeSheetGenerator;
	private final PaymentListService paymentListService;
	private final TransactionService transactionService;
	private final PaymentRepository paymentRepository;
	private final AuditLogger auditLogger;


	@Transactional(readOnly = true)
	public GenResultPayload getPaymentSpreadsheet(UUID listId) throws IOException {
		PaymentList list = paymentListService.getOrThrow(listId);

		List<Payment> payments = paymentRepository.findByListIdWithSettlements(listId).stream()
				.sorted(Comparator
						.comparing((Payment payment) -> !payment.isSettled())
						.thenComparing(payment -> !payment.holdsSettlements()))
				.toList();

		var listReportView = listReportService.buildListReportView(list, payments);
		var transactionViews = transactionService.getAllForList(listId);

		GenResultPayload genResult;

		try {
			genResult = financeSheetGenerator.generatePaymentListFullReport(listReportView, transactionViews);
		} catch (IOException e) {
			var errorMsg = "Failed to create payment list %s spreadsheet".formatted(list.getName());
			auditLogger.failure(AuditEventType.PAYMENT_SPREADSHEET_CREATION, list.getId(), errorMsg);
			throw e;
		}

		auditLogger.successNow(AuditEventType.PAYMENT_SPREADSHEET_CREATION, list.getId(), "Created spreadsheet for list %s.", list.getName());
		return genResult;
	}
}
