package atomdance.app.modules.discount.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.discount.dto.DiscountView;
import atomdance.app.modules.discount.dto.SaveDiscountRequest;
import atomdance.app.modules.discount.model.FamilySizeDiscount;
import atomdance.app.modules.discount.model.GroupCountDiscount;
import atomdance.app.modules.discount.repository.FamilySizeDiscountRepository;
import atomdance.app.modules.discount.repository.GroupCountDiscountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;


/**
 * Reads and edits the discount ladders.
 * Editing a ladder changes nothing that has already been calculated: every payment line snapshots the percentage it was built with,
 * so a closed month keeps its figures even after the configuration behind them is replaced.
 */
@Service
@RequiredArgsConstructor
public class DiscountService {

	private static final Sort BY_POSITION = Sort.by(Sort.Direction.ASC, "position");
	private static final Sort BY_GROUP_COUNT = Sort.by(Sort.Direction.ASC, "groupCount");

	private final FamilySizeDiscountRepository familySizeDiscountRepository;
	private final GroupCountDiscountRepository groupCountDiscountRepository;
	private final AuditLogger auditLogger;


	/**
	 * The snapshot the payment calculator works from. Read once per calculation rather than per person.
	 */
	@Transactional(readOnly = true)
	public DiscountRules currentRules() {
		return DiscountRules.of(familySizeDiscountRepository.findAll(), groupCountDiscountRepository.findAll());
	}


	@Transactional(readOnly = true)
	public DiscountView get() {
		return DiscountView.of(
				familySizeDiscountRepository.findAll(BY_POSITION),
				groupCountDiscountRepository.findAll(BY_GROUP_COUNT)
		);
	}


	@Transactional
	public DiscountView saveFamilySizeDiscount(SaveDiscountRequest request) {
		FamilySizeDiscount discount = familySizeDiscountRepository.findByPosition(request.threshold())
				.orElseGet(() -> FamilySizeDiscount.builder().position(request.threshold()).build());

		discount.setPercent(request.percent());
		familySizeDiscountRepository.save(discount);

		auditLogger.success(AuditEventType.DISCOUNT_MANAGEMENT, discount.getId(), "Family-size discount for person %d set to %s%% from %s%%.", request.threshold(), request.percent(), discount.getPercent());

		return get();
	}


	@Transactional
	public DiscountView saveGroupCountDiscount(SaveDiscountRequest request) {
		GroupCountDiscount discount = groupCountDiscountRepository.findByGroupCount(request.threshold())
				.orElseGet(() -> GroupCountDiscount.builder().groupCount(request.threshold()).build());

		discount.setPercent(request.percent());
		groupCountDiscountRepository.save(discount);

		auditLogger.success(AuditEventType.DISCOUNT_MANAGEMENT, discount.getId(), "Group-count discount for %d group(s) set to %s%% from %s%%.", request.threshold(), request.percent(), discount.getPercent());

		return get();
	}


	@Transactional
	public DiscountView deleteFamilySizeDiscount(UUID id) {
		FamilySizeDiscount discount = familySizeDiscountRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("entity.discount"));

		familySizeDiscountRepository.delete(discount);

		auditLogger.success(AuditEventType.DISCOUNT_MANAGEMENT, id, "Family-size discount for person %d has been removed.", discount.getPosition());

		return get();
	}


	@Transactional
	public DiscountView deleteGroupCountDiscount(UUID id) {
		GroupCountDiscount discount = groupCountDiscountRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("entity.discount"));

		groupCountDiscountRepository.delete(discount);

		auditLogger.success(AuditEventType.DISCOUNT_MANAGEMENT, id, "Group-count discount for %d group(s) has been removed.", discount.getGroupCount());

		return get();
	}
}
