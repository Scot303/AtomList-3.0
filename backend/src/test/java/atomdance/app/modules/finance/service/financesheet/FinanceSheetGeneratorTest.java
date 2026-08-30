package atomdance.app.modules.finance.service.financesheet;

import atomdance.app.modules.finance.paymentList.service.FinanceSheetService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class FinanceSheetGeneratorTest {

    @Autowired
    private FinanceSheetService financeSheetService;

    @Test
    void testSomething() throws IOException {
        byte[] sheet = financeSheetService.getPaymentSpreadsheet(UUID.fromString("09fc5592-e2a0-43f1-b767-4c795e0bbec7"));

        assertThat(sheet)
                .isNotNull();

        Files.write(Paths.get("test-sheet.xlsx"), sheet);
    }
}
