package atomdance.app.modules.finance.paymentList.service;

import atomdance.app.modules.attendance.model.GenResultPayload;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.finance.payment.dto.PaymentView;
import atomdance.app.modules.finance.payment.model.Payment;
import atomdance.app.modules.finance.payment.repository.PaymentRepository;
import atomdance.app.modules.finance.paymentList.model.PaymentList;
import atomdance.app.modules.finance.paymentList.service.financesheet.FinanceSheetGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class FinanceSheetService {

	private final ListReportService listReportService;
	private final FinanceSheetGenerator financeSheetGenerator;
	private final PaymentListService paymentListService;
	private final PaymentRepository paymentRepository;
	private final AuditLogger auditLogger;


	@Transactional(readOnly = true)
	public GenResultPayload getPaymentSpreadsheet(UUID id) throws IOException {
		PaymentList list = paymentListService.getOrThrow(id);

		List<Payment> payments = paymentRepository.findByListIdWithSettlements(id).stream()
				.sorted(PaymentView.DISPLAY_ORDER)
				.toList();

		var listReportView = listReportService.buildListReportView(list, payments);

		GenResultPayload genResult;

		try {
			genResult = financeSheetGenerator.generateFinanceSheet(listReportView);
		} catch (IOException e) {
			var errorMsg = "Failed to create payment list %s spreadsheet".formatted(list.getName());
			auditLogger.failure(AuditEventType.PAYMENT_SPREADSHEET_CREATION, list.getId(), errorMsg);
			throw e;
		}

		auditLogger.successNow(AuditEventType.PAYMENT_SPREADSHEET_CREATION, list.getId(), "Created spreadsheet for list %s.", list.getName());
		return genResult;
	}
}
