package atomdance.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Turns on {@code @Scheduled} processing.
 * Kept in its own class so a test slice can exclude it.
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
