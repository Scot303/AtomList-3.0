package atomdance.app.modules.user.service;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The code is the whole credential now that passwords are gone, so its two jobs are worth pinning
 * down: it has to be unguessable, and it has to be typeable by someone who is not enjoying it.
 */
class LoginCodeGeneratorTest {

	private final LoginCodeGenerator generator = new LoginCodeGenerator();

	@Test
	void producesCodesOfTheRequestedLength() {
		assertThat(generator.generate(16)).hasSize(16);
	}

	@Test
	void neverUsesCharactersThatLookLikeOtherCharacters() {
		StringBuilder everything = new StringBuilder();

		for (int i = 0; i < 500; i++) {
			everything.append(generator.generate(16));
		}

		assertThat(everything.toString()).doesNotContain("I", "l", "1", "O", "o", "0");
	}

	@Test
	void doesNotRepeatItself() {
		Set<String> codes = new HashSet<>();

		for (int i = 0; i < 1_000; i++) {
			codes.add(generator.generate(16));
		}

		assertThat(codes).hasSize(1_000);
	}

	@Test
	void groupsTheCodeForReadingWithoutChangingIt() {
		String grouped = generator.forDisplay("ABCDEFGHJKLMNPQR");

		assertThat(grouped).isEqualTo("ABCD EFGH JKLM NPQR");
		assertThat(LoginCodeGenerator.normalize(grouped)).isEqualTo("ABCDEFGHJKLMNPQR");
	}

	@Test
	void stripsWhateverAMailClientOrAHesitantTypistAdded() {
		assertThat(LoginCodeGenerator.normalize("  ABCD\tEFGH\nJKLM PQRS  ")).isEqualTo("ABCDEFGHJKLMPQRS");
		assertThat(LoginCodeGenerator.normalize(null)).isEmpty();
	}
}
