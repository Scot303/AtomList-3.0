package atomdance.app.modules.discount.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.discount.dto.PriceQuoteRequest;
import atomdance.app.modules.discount.dto.PriceQuoteView;
import atomdance.app.modules.discount.dto.ScopeSplit;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;


/**
 * Prices up a household that does not exist yet - what somebody at the desk would pay if they signed up today.
 * <p>
 * Two things a real household has and a quoted one does not:
 * <ul>
 *     <li>Seniority. {@link FamilyPositions} breaks a tie on equal monthly charges by who joined the studio first;
 *     nobody here has joined, so the order they were entered in stands in for it.</li>
 *     <li>A month. There are no memberships, so there is no part-month joining rate and no mid-month change.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class PriceQuoteService {

	private static final Comparator<PickedGroup> BY_GROUP_NAME = Comparator
			.comparing((PickedGroup pickedGroup) -> pickedGroup.group().getName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparing(pickedGroup -> String.valueOf(pickedGroup.group().getId()));

	private static final Comparator<DraftMember> BY_DISCOUNT_PRIORITY = Comparator
			.comparing(DraftMember::monthlyBase, Comparator.reverseOrder())
			.thenComparingInt(DraftMember::index);

	private final GroupRepository groupRepository;
	private final DiscountService discountService;


	@Transactional(readOnly = true)
	public PriceQuoteView quote(PriceQuoteRequest request) {
		Map<UUID, Group> groups = resolveGroups(request);
		DiscountRules rules = discountService.currentRules();

		List<DraftMember> draftMembers = new ArrayList<>();

		for (int index = 0; index < request.members().size(); index++) {
			draftMembers.add(draft(index, request.members().get(index), groups));
		}

		Map<Integer, Integer> positions = positions(draftMembers);

		List<PriceQuoteView.Member> members = new ArrayList<>();
		ScopeSplit household = ScopeSplit.zero();

		for (DraftMember draftMember : draftMembers) {
			PriceQuoteView.Member member = price(draftMember, positions.get(draftMember.index()), rules);

			members.add(member);
			household = household.plus(member.totals());
		}

		return new PriceQuoteView(
				members,
				household,
				ladder(rules.familyLadder()),
				ladder(rules.groupCountLadder()),
				Money.normalize(DiscountRules.STUDENT_DISCOUNT_PERCENT)
		);
	}


	/**
	 * Every group the request names, in one read.
	 */
	private Map<UUID, Group> resolveGroups(PriceQuoteRequest request) {
		Set<UUID> ids = new LinkedHashSet<>();

		for (PriceQuoteRequest.Member member : request.members()) {
			for (PriceQuoteRequest.Selection selection : member.groups()) {
				ids.add(selection.groupId());
			}
		}

		Map<UUID, Group> groups = new HashMap<>();

		for (Group group : groupRepository.findAllById(ids)) {
			groups.put(group.getId(), group);
		}

		if (groups.size() < ids.size()) {
			throw new NotFoundException("entity.group");
		}

		return groups;
	}


	/**
	 * Reduces one requested person to the figures both ladders are read off.
	 */
	private static DraftMember draft(int index, PriceQuoteRequest.Member member, Map<UUID, Group> groups) {
		Map<UUID, PickedGroup> byGroup = new LinkedHashMap<>();

		for (PriceQuoteRequest.Selection selection : member.groups()) {
			Group group = groups.get(selection.groupId());

			byGroup.putIfAbsent(group.getId(), new PickedGroup(
					group,
					group.isPerClass() ? selection.entriesOrOne() : 1,
					Money.normalize(selection.unitCostOr(group.getCostForAttending()))
			));
		}

		List<PickedGroup> pickedGroups = byGroup.values().stream().sorted(BY_GROUP_NAME).toList();

		BigDecimal monthlyBase = Money.ZERO;
		int groupCount = 0;

		for (PickedGroup pickedGroup : pickedGroups) {
			// The household order is decided on the recurring charge only, since what a per-class group costs depends on attendance.
			if (!pickedGroup.group().isPerClass()) {
				monthlyBase = Money.add(monthlyBase, pickedGroup.unitCost());
			}

			if (isCharged(pickedGroup.unitCost())) {
				groupCount++;
			}
		}

		// Neither ladder counts a group somebody pays nothing for, so somebody whose every group is free is not billed at all.
		return new DraftMember(index, member.studentDiscount(), pickedGroups, monthlyBase, groupCount, groupCount > 0);
	}


	/**
	 * Whether a group bills anything at all, which is what decides whether either ladder counts it.
	 * The rate is read, not the total: a per-class group at a positive rate counts even before any class is attended.
	 * An agreed rate of nothing therefore takes a paid-for group out of both ladders, exactly as a {@code customMonthlyCost} of zero does on a real membership.
	 */
	private static boolean isCharged(BigDecimal unitCost) {
		return Money.isPositive(unitCost);
	}


	/**
	 * Who sits where in the household, counting from 1.
	 * Somebody billed nothing takes up no rung, so a free group cannot push a paying person further down the ladder.
	 *
	 * @return the position of each billed person, keyed by their index in the request
	 */
	private static Map<Integer, Integer> positions(List<DraftMember> draftMembers) {
		List<DraftMember> billed = draftMembers.stream()
				.filter(DraftMember::billed)
				.sorted(BY_DISCOUNT_PRIORITY)
				.toList();

		Map<Integer, Integer> positions = new HashMap<>();

		for (int index = 0; index < billed.size(); index++) {
			positions.put(billed.get(index).index(), index + 1);
		}

		return positions;
	}


	/**
	 * @param position where this person sits in the household, or {@code null} when nothing is billed for them
	 */
	private static PriceQuoteView.Member price(DraftMember draftMember, Integer position, DiscountRules rules) {
		boolean billed = position != null;
		int groupCount = draftMember.groupCount();
		boolean student = draftMember.student();

		BigDecimal familyPercent = billed ? rules.familyPercent(position) : Money.ZERO;
		BigDecimal groupCountPercent = billed ? rules.groupCountPercent(groupCount) : Money.ZERO;
		BigDecimal studentPercent = billed ? rules.studentPercent(student) : Money.ZERO;
		BigDecimal totalPercent = billed ? rules.combinedPercent(position, groupCount, student) : Money.ZERO;

		List<PriceQuoteView.Line> lines = new ArrayList<>();
		ScopeSplit totals = ScopeSplit.zero();

		for (PickedGroup pickedGroup : draftMember.pickedGroups()) {
			PriceQuoteView.Line line = line(pickedGroup, totalPercent);

			lines.add(line);
			totals = totals.plus(pickedGroup.group().getType(), line.asScope());
		}

		return new PriceQuoteView.Member(
				draftMember.index(),
				billed,
				position,
				billed ? rules.familyThreshold(position) : null,
				groupCount,
				billed ? rules.groupCountThreshold(groupCount) : null,
				Money.normalize(draftMember.monthlyBase()),
				student,
				familyPercent,
				groupCountPercent,
				studentPercent,
				totalPercent,
				Money.isGreaterThan(Money.add(Money.add(familyPercent, groupCountPercent), studentPercent), totalPercent),
				lines,
				totals
		);
	}


	/**
	 * One group's price, discounted exactly as a payment line is.
	 */
	private static PriceQuoteView.Line line(PickedGroup pickedGroup, BigDecimal percent) {
		Group group = pickedGroup.group();

		BigDecimal unitCost = pickedGroup.unitCost();
		BigDecimal gross = Money.multiply(unitCost, BigDecimal.valueOf(pickedGroup.entries()));
		BigDecimal discountAmount = Money.percentOf(gross, percent);

		return PriceQuoteView.Line.of(
				group.getId(),
				group.getName(),
				group.getType(),
				group.isPerClass(),
				unitCost,
				pickedGroup.entries(),
				gross,
				discountAmount,
				Money.atLeastZero(Money.subtract(gross, discountAmount)),
				isCharged(unitCost)
		);
	}


	private static List<PriceQuoteView.Rung> ladder(NavigableMap<Integer, BigDecimal> rungs) {
		return rungs.entrySet().stream()
				.map(rung -> new PriceQuoteView.Rung(rung.getKey(), Money.normalize(rung.getValue())))
				.toList();
	}


	/**
	 * One group somebody would join, and how many times they would be billed for it.
	 *
	 * @param unitCost the rate to bill, already resolved: the individually agreed amount when one was named, the group's own otherwise.
	 */
	private record PickedGroup(Group group, int entries, BigDecimal unitCost) {}


	/**
	 * One requested person, reduced to what the ladders need.
	 *
	 * @param index  their position in the request, which is the tiebreaker seniority would be in a real household
	 * @param billed whether anything at all is charged for them
	 */
	private record DraftMember(int index, boolean student, List<PickedGroup> pickedGroups, BigDecimal monthlyBase, int groupCount, boolean billed) {}
}
