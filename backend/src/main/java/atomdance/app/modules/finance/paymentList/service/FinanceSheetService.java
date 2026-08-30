package atomdance.app.modules.finance.paymentList.service;

import atomdance.app.modules.finance.paymentList.service.financesheet.FinanceSheetGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinanceSheetService {
    private final ListReportService listReportService;
    private final FinanceSheetGenerator financeSheetGenerator;

    @Transactional(readOnly = true)
    public byte[] getPaymentSpreadsheet(UUID id) throws IOException {
        var listReportView = listReportService.buildListReportView(id);

        return financeSheetGenerator.generateFinanceSheet(listReportView);
    }
}
