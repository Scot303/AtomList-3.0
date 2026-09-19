package atomdance.app.modules.finance.service.financesheet;

import atomdance.app.modules.finance.paymentList.service.FinanceSheetService;
import atomdance.app.modules.user.model.Permission;
import atomdance.app.modules.user.service.SecurityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
class FinanceSheetGeneratorTest {

    @Autowired
    private FinanceSheetService financeSheetService;

    @MockitoBean
    private SecurityService securityService;

    @BeforeEach
    void setup() {
        when(securityService.hasPermission(any(Permission.class))).thenReturn(true);
    }

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
