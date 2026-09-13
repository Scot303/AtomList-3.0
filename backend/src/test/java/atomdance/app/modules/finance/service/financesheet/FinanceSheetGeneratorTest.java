package atomdance.app.modules.finance.service.financesheet;

import atomdance.app.modules.finance.paymentList.service.FinanceSheetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class FinanceSheetGeneratorTest {

    @Autowired
    private FinanceSheetService financeSheetService;

    @Test
    void testSomething() throws IOException {
        var start = Instant.now();
        var sheet = financeSheetService.getPaymentSpreadsheet(UUID.fromString("de3e64bd-1443-4d97-9012-15c7aadaaa7d"));
        var finish = Instant.now();

        assertThat(sheet)
                .isNotNull();

        Files.write(Paths.get("test-sheet.xlsx"), sheet.pdfBytes());
        System.out.println("Elapsed time (ms):" + Duration.between(start, finish).toMillis());
    }
}
