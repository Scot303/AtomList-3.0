package atomdance.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Turns on {@code @Async} processing.
 * Kept in its own class so a test slice can exclude it.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
