package atomdance.app.modules.discount.controller;

import atomdance.app.modules.discount.dto.PriceQuoteRequest;
import atomdance.app.modules.discount.dto.PriceQuoteView;
import atomdance.app.modules.discount.service.PriceQuoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


/**
 * What a household that does not exist yet would pay.
 * <p>
 * Kept apart from {@link DiscountController}, whose every endpoint governs the configuration itself and needs {@code READ_DISCOUNTS}.
 * This one only reads prices out and is reachable by anybody who can already see what a group costs.
 */
@RestController
@RequestMapping("/api/price-quotes")
@RequiredArgsConstructor
public class PriceQuoteController {

	private final PriceQuoteService priceQuoteService;


	@PostMapping
	@PreAuthorize("hasAuthority('READ_GROUPS')")
	public PriceQuoteView quote(@RequestBody @Valid PriceQuoteRequest request) {
		return priceQuoteService.quote(request);
	}
}
