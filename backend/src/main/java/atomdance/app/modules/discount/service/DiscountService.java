package atomdance.app.modules.discount.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.discount.dto.DiscountView;
import atomdance.app.modules.discount.dto.SaveDiscountRequest;
import atomdance.app.modules.discount.model.FamilySizeDiscount;
import atomdance.app.modules.discount.model.GroupCountDiscount;
import atomdance.app.modules.discount.repository.FamilySizeDiscountRepository;
import atomdance.app.modules.discount.repository.GroupCountDiscountRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Reads and edits the discount ladders.
 * Editing a ladder changes nothing that has already been calculated: every payment line snapshots the percentage it was built with,
 * so a closed month keeps its figures even after the configuration behind them is replaced.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DiscountService {

	private static final Sort BY_POSITION = Sort.by(Sort.Direction.ASC, "position");
	private static final Sort BY_GROUP_COUNT = Sort.by(Sort.Direction.ASC, "groupCount");

	private final FamilySizeDiscountRepository familySizeDiscountRepository;
	private final GroupCountDiscountRepository groupCountDiscountRepository;
	private final SecurityService securityService;
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
		auditLogger.record(securityService.getCurrentUserId(), AuditEventType.DISCOUNT_PREVIEW, AuditOutcome.SUCCESS, "Preview of all discounts.");

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

		log.info("Family-size discount for position {} set to {}%", request.threshold(), request.percent());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), discount.getId(), AuditEventType.DISCOUNT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family-size discount for person %d set to %s%% from %s%%.", request.threshold(), request.percent(), discount.getPercent()));

		return get();
	}

	@Transactional
	public DiscountView saveGroupCountDiscount(SaveDiscountRequest request) {
		GroupCountDiscount discount = groupCountDiscountRepository.findByGroupCount(request.threshold())
				.orElseGet(() -> GroupCountDiscount.builder().groupCount(request.threshold()).build());

		discount.setPercent(request.percent());
		groupCountDiscountRepository.save(discount);

		log.info("Group-count discount for {} group(s) set to {}%", request.threshold(), request.percent());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), discount.getId(), AuditEventType.DISCOUNT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Group-count discount for %d group(s) set to %s%% from %s%%.", request.threshold(), request.percent(), discount.getPercent()));

		return get();
	}

	@Transactional
	public DiscountView deleteFamilySizeDiscount(UUID id) {
		FamilySizeDiscount discount = familySizeDiscountRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("entity.discount"));

		familySizeDiscountRepository.delete(discount);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), id, AuditEventType.DISCOUNT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Family-size discount for person %d has been removed.", discount.getPosition()));

		return get();
	}

	@Transactional
	public DiscountView deleteGroupCountDiscount(UUID id) {
		GroupCountDiscount discount = groupCountDiscountRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("entity.discount"));

		groupCountDiscountRepository.delete(discount);

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), id, AuditEventType.DISCOUNT_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Group-count discount for %d group(s) has been removed.", discount.getGroupCount()));

		return get();
	}
}
