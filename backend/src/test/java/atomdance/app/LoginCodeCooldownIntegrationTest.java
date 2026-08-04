package atomdance.app;

import atomdance.app.modules.user.model.Role;
import atomdance.app.support.AuthIntegrationTestBase;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The resend cooldown is switched off for the rest of the suite so tests can ask for a second code
 * freely, which leaves this behavior uncovered - hence its own context.
 * Worth the extra context: the cooldown is the only thing stopping the request endpoint being aimed
 * at somebody else's mailbox as a flooding tool, and it is also what stops a user who clicks twice
 * invalidating the very code they are about to type.
 */
@SpringBootTest(properties = "app.security.login.code.resend-cooldown=10m")
class LoginCodeCooldownIntegrationTest extends AuthIntegrationTestBase {

	@Test
	void asecondRequestInsideTheCooldownSendsNothingAndLeavesTheFirstCodeAlive() throws Exception {
		givenUser("admin", Role.ADMIN);

		String first = mailedCodeFor("admin");

		requestCode("admin");

		assertThat(mailer().loginCodes()).hasSize(1);

		verifyCode("admin", first, org.springframework.test.web.servlet.result.MockMvcResultMatchers.status().isOk());
	}
}
