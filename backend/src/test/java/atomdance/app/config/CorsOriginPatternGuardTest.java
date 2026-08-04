package atomdance.app.config;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CorsOriginPatternGuardTest {

	@Test
	void rejectsAWildcardThatCoversAWholeSharedDomain() {
		// Anyone can deploy to pages.dev, so this pattern trusts the entire internet.
		assertThatThrownBy(() -> SecurityConfig.assertOriginPatternsAreScoped(List.of("https://*.pages.dev")))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("too broad");
	}

	@Test
	void rejectsABareWildcard() {
		assertThatThrownBy(() -> SecurityConfig.assertOriginPatternsAreScoped(List.of("https://*")))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void rejectsABroadPatternHidingBehindValidOnes() {
		assertThatThrownBy(() -> SecurityConfig.assertOriginPatternsAreScoped(
				List.of("https://atomlist.app", "https://*.pages.dev")))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void allowsAWildcardScopedToOurOwnProject() {
		assertThatCode(() -> SecurityConfig.assertOriginPatternsAreScoped(
				List.of("https://atomlist-*.pages.dev", "https://atomlist.app", "http://localhost:5173")))
				.doesNotThrowAnyException();
	}
}
