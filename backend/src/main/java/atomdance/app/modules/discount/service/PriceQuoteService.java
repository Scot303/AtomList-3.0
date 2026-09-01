package atomdance.app.modules.discount.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.Money;
import atomdance.app.modules.discount.dto.PriceQuoteRequest;
import atomdance.app.modules.discount.dto.PriceQuoteView;
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
 *     <li>A month. There are no memberships, so there is no part-month joining rate and no mid-month change - the rate is always the group's own.</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class PriceQuoteService {

	private static final Comparator<Pick> BY_GROUP_NAME = Comparator
			.comparing((Pick pick) -> pick.group().getName(), String.CASE_INSENSITIVE_ORDER)
			.thenComparing(pick -> String.valueOf(pick.group().getId()));

	private static final Comparator<Draft> BY_DISCOUNT_PRIORITY = Comparator
			.comparing(Draft::monthlyBase, Comparator.reverseOrder())
			.thenComparingInt(Draft::index);

	private final GroupRepository groupRepository;
	private final DiscountService discountService;


	@Transactional(readOnly = true)
	public PriceQuoteView quote(PriceQuoteRequest request) {
		Map<UUID, Group> groups = resolveGroups(request);
		DiscountRules rules = discountService.currentRules();

		List<Draft> drafts = new ArrayList<>();

		for (int index = 0; index < request.members().size(); index++) {
			drafts.add(draft(index, request.members().get(index), groups));
		}

		Map<Integer, Integer> positions = positions(drafts);

		List<PriceQuoteView.Member> members = new ArrayList<>();
		PriceQuoteView.Totals household = PriceQuoteView.Totals.zero();

		for (Draft draft : drafts) {
			PriceQuoteView.Member member = price(draft, positions.get(draft.index()), rules);

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
	private static Draft draft(int index, PriceQuoteRequest.Member member, Map<UUID, Group> groups) {
		Map<UUID, Pick> byGroup = new LinkedHashMap<>();

		for (PriceQuoteRequest.Selection selection : member.groups()) {
			Group group = groups.get(selection.groupId());

			byGroup.putIfAbsent(group.getId(), new Pick(group, group.isPerClass() ? selection.entriesOrOne() : 1));
		}

		List<Pick> picks = byGroup.values().stream().sorted(BY_GROUP_NAME).toList();

		BigDecimal monthlyBase = Money.ZERO;
		int groupCount = 0;

		for (Pick pick : picks) {
			// The household order is decided on the recurring charge only, since what a per-class group costs depends on attendance.
			if (!pick.group().isPerClass()) {
				monthlyBase = Money.add(monthlyBase, Money.normalize(pick.group().getCostForAttending()));
			}

			if (isCharged(pick.group())) {
				groupCount++;
			}
		}

		// Neither ladder counts a group somebody pays nothing for, so somebody whose every group is free is not billed at all.
		return new Draft(index, member.studentDiscount(), picks, monthlyBase, groupCount, groupCount > 0);
	}


	/**
	 * Whether a group bills anything at all, which is what decides whether either ladder counts it.
	 * The rate is read, not the total: a per-class group at a positive rate counts even before any class is attended.
	 */
	private static boolean isCharged(Group group) {
		return Money.isPositive(Money.normalize(group.getCostForAttending()));
	}


	/**
	 * Who sits where in the household, counting from 1.
	 * Somebody billed nothing takes up no rung, so a free group cannot push a paying person further down the ladder.
	 *
	 * @return the position of each billed person, keyed by their index in the request
	 */
	private static Map<Integer, Integer> positions(List<Draft> drafts) {
		List<Draft> billed = drafts.stream()
				.filter(Draft::billed)
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
	private static PriceQuoteView.Member price(Draft draft, Integer position, DiscountRules rules) {
		boolean billed = position != null;
		int groupCount = draft.groupCount();
		boolean student = draft.student();

		BigDecimal familyPercent = billed ? rules.familyPercent(position) : Money.ZERO;
		BigDecimal groupCountPercent = billed ? rules.groupCountPercent(groupCount) : Money.ZERO;
		BigDecimal studentPercent = billed ? rules.studentPercent(student) : Money.ZERO;
		BigDecimal totalPercent = billed ? rules.combinedPercent(position, groupCount, student) : Money.ZERO;

		List<PriceQuoteView.Line> lines = new ArrayList<>();
		PriceQuoteView.Totals totals = PriceQuoteView.Totals.zero();

		for (Pick pick : draft.picks()) {
			PriceQuoteView.Line line = line(pick, totalPercent);

			lines.add(line);
			totals = totals.plus(pick.group().getType(), line.asScope());
		}

		return new PriceQuoteView.Member(
				draft.index(),
				billed,
				position,
				billed ? rules.familyThreshold(position) : null,
				groupCount,
				billed ? rules.groupCountThreshold(groupCount) : null,
				Money.normalize(draft.monthlyBase()),
				student,
				familyPercent,
				groupCountPercent,
				studentPercent,
				totalPercent,
				// The three parts add up rather than compounding, so a deep enough configuration can sum past the cap.
				Money.isGreaterThan(Money.add(Money.add(familyPercent, groupCountPercent), studentPercent), totalPercent),
				lines,
				totals
		);
	}


	/**
	 * One group's price, discounted exactly as a payment line is.
	 */
	private static PriceQuoteView.Line line(Pick pick, BigDecimal percent) {
		Group group = pick.group();

		BigDecimal unitCost = Money.normalize(group.getCostForAttending());
		BigDecimal gross = Money.multiply(unitCost, BigDecimal.valueOf(pick.entries()));
		BigDecimal discountAmount = Money.percentOf(gross, percent);

		return PriceQuoteView.Line.of(
				group.getId(),
				group.getName(),
				group.getType(),
				group.isPerClass(),
				unitCost,
				pick.entries(),
				gross,
				discountAmount,
				Money.atLeastZero(Money.subtract(gross, discountAmount)),
				isCharged(group)
		);
	}


	private static List<PriceQuoteView.Rung> ladder(NavigableMap<Integer, BigDecimal> rungs) {
		return rungs.entrySet().stream()
				.map(rung -> new PriceQuoteView.Rung(rung.getKey(), Money.normalize(rung.getValue())))
				.toList();
	}


	/**
	 * One group somebody would join, and how many times they would be billed for it.
	 */
	private record Pick(Group group, int entries) {}


	/**
	 * One requested person, reduced to what the ladders need.
	 *
	 * @param index  their position in the request, which is the tiebreaker seniority would be in a real household
	 * @param billed whether anything at all is charged for them
	 */
	private record Draft(int index, boolean student, List<Pick> picks, BigDecimal monthlyBase, int groupCount, boolean billed) {}
}
