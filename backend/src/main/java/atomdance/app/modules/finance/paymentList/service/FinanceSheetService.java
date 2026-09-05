package atomdance.app.modules.finance.paymentList.service;

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


	@Transactional(readOnly = true)
	public byte[] getPaymentSpreadsheet(UUID id) throws IOException {
		PaymentList list = paymentListService.getOrThrow(id);

		List<Payment> payments = paymentRepository.findByListId(id).stream()
				.sorted(PaymentView.DISPLAY_ORDER)
				.toList();

		var listReportView = listReportService.buildListReportView(list, payments);

		return financeSheetGenerator.generateFinanceSheet(listReportView);
	}
}
