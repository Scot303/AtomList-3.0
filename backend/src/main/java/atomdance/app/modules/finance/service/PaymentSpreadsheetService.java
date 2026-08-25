package atomdance.app.modules.finance.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentSpreadsheetService {
    private final ListReportService listReportService;

    @Transactional(readOnly = true)
    public byte[] getPaymentSpreadsheet(UUID id) {
        listReportService.buildListReportView(id);
    }
}
