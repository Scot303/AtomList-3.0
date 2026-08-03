package atomdance.app.modules.discount.controller;

import atomdance.app.modules.discount.dto.DiscountView;
import atomdance.app.modules.discount.dto.SaveDiscountRequest;
import atomdance.app.modules.discount.service.DiscountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * The two discount ladders. Editing one affects future calculations only - lists already built keep the percentages their payment lines snapshotted.
 */
@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountController {

	private final DiscountService discountService;

	@GetMapping
	@PreAuthorize("hasAuthority('READ_DISCOUNTS')")
	public DiscountView get() {
		return discountService.get();
	}

	/**
	 * Upsert by position - sending an existing position replaces its percentage.
	 */
	@PutMapping("/family-size")
	@PreAuthorize("hasAuthority('MODIFY_DISCOUNTS')")
	public DiscountView saveFamilySize(@RequestBody @Valid SaveDiscountRequest request) {
		return discountService.saveFamilySizeDiscount(request);
	}

	@PutMapping("/group-count")
	@PreAuthorize("hasAuthority('MODIFY_DISCOUNTS')")
	public DiscountView saveGroupCount(@RequestBody @Valid SaveDiscountRequest request) {
		return discountService.saveGroupCountDiscount(request);
	}

	@DeleteMapping("/family-size/{id}")
	@PreAuthorize("hasAuthority('MODIFY_DISCOUNTS')")
	public DiscountView deleteFamilySize(@PathVariable UUID id) {
		return discountService.deleteFamilySizeDiscount(id);
	}

	@DeleteMapping("/group-count/{id}")
	@PreAuthorize("hasAuthority('MODIFY_DISCOUNTS')")
	public DiscountView deleteGroupCount(@PathVariable UUID id) {
		return discountService.deleteGroupCountDiscount(id);
	}
}
