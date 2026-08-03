package atomdance.app.modules.discount.service;

import atomdance.app.modules.discount.model.FamilySizeDiscount;
import atomdance.app.modules.discount.repository.FamilySizeDiscountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Puts the studio's current family discount ladder in place on a fresh database.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DiscountSeeder implements ApplicationRunner {

	/**
	 * Position to percentage.
	 */
	private static final Map<Integer, BigDecimal> DEFAULT_FAMILY_LADDER = Map.of(
			1, BigDecimal.ZERO,
			2, BigDecimal.TEN,
			3, BigDecimal.valueOf(20)
	);

	private final FamilySizeDiscountRepository familySizeDiscountRepository;

	@Value("${app.discounts.seed-defaults:true}")
	private boolean seedDefaults;

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (!seedDefaults) {
			return;
		}

		if (familySizeDiscountRepository.count() > 0) {
			return;
		}

		try {
			DEFAULT_FAMILY_LADDER.forEach((position, percent) -> familySizeDiscountRepository.save(
					FamilySizeDiscount.builder().position(position).percent(percent).build())
			);

			log.info("Seeded the default family discount ladder: {}", DEFAULT_FAMILY_LADDER);
		} catch (DataIntegrityViolationException e) {
			log.debug("Family discount ladder was seeded concurrently by another instance");
		}
	}
}
