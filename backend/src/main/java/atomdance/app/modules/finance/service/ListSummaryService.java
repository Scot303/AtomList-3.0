package atomdance.app.modules.finance.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.dto.ListSummaryView;
import atomdance.app.modules.finance.dto.MonthSummaryView;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.model.Season;
import atomdance.app.modules.finance.model.TransactionType;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.finance.repository.PaymentSettlementRepository;
import atomdance.app.modules.finance.repository.TransactionRepository;
import atomdance.app.modules.finance.repository.projection.ListAmount;
import atomdance.app.modules.finance.repository.projection.PaymentCounts;
import atomdance.app.modules.finance.repository.projection.PaymentOutstanding;
import atomdance.app.modules.finance.repository.projection.TransactionTotals;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;


/**
 * A season of standard lists at a glance: what each month billed, what it has settled, and what surrounds it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ListSummaryService {

	private final PaymentListRepository paymentListRepository;
	private final PaymentRepository paymentRepository;
	private final PaymentSettlementRepository settlementRepository;
	private final TransactionRepository transactionRepository;
	private final SecurityService securityService;


	/**
	 * The twelve months of one season, in the order they happen: September of {@code startYear} through to August of the year after it.
	 *
	 * @param startYear the calendar year the season opens in - 2026 for the 2026/2027 season
	 */
	@Transactional(readOnly = true)
	public List<MonthSummaryView> summariseSeason(int startYear) {
		List<YearMonth> season = Season.months(startYear);

		List<PaymentList> lists = paymentListRepository.findByYearInAndTypeIn(List.of(startYear, startYear + 1), ListType.standardTypes());

		Set<TransactionType> readable = readableTypes();

		Map<UUID, PaymentCounts> counts = paymentCounts(lists);
		Map<UUID, BigDecimal> billed = amountsByList(lists, paymentRepository::sumBilledByListIds);
		Map<UUID, BigDecimal> collected = amountsByList(lists, settlementRepository::sumCollectedByListIds);
		Map<UUID, BigDecimal> cleared = amountsByList(lists, settlementRepository::sumClearedByListIds);
		Map<UUID, BigDecimal> outstanding = outstandingTotals(lists);
		Map<UUID, Map<TransactionType, BigDecimal>> transactions = transactionTotals(lists, readable);

		Map<YearMonth, List<PaymentList>> byMonth = lists.stream().collect(Collectors.groupingBy(PaymentList::yearMonth));

		List<MonthSummaryView> months = new ArrayList<>(Season.MONTHS);

		for (YearMonth month : season) {
			months.add(summarise(month, byMonth.getOrDefault(month, List.of()), counts, billed, collected, cleared, outstanding, transactions, readable));
		}

		return months;
	}


	private MonthSummaryView summarise(YearMonth month, List<PaymentList> lists, Map<UUID, PaymentCounts> counts, Map<UUID, BigDecimal> billed, Map<UUID, BigDecimal> collected, Map<UUID, BigDecimal> cleared, Map<UUID, BigDecimal> outstanding, Map<UUID, Map<TransactionType, BigDecimal>> transactions, Set<TransactionType> readable) {
		PaymentList tournament = firstMatching(lists, true);
		PaymentList open = firstMatching(lists, false);

		return new MonthSummaryView(
				month.getYear(),
				month.getMonthValue(),
				slot(tournament, counts),
				slot(open, counts),
				sumOver(lists, billed),
				sumOver(lists, collected),
				sumOver(lists, cleared),
				sumOver(lists, outstanding),
				sumTransactions(lists, transactions, TransactionType.EXPENSE, readable),
				sumTransactions(lists, transactions, TransactionType.INCOME, readable)
		);
	}


	private static BigDecimal sumOver(List<PaymentList> lists, Map<UUID, BigDecimal> byList) {
		BigDecimal total = Money.ZERO;

		for (PaymentList list : lists) {
			total = Money.add(total, byList.getOrDefault(list.getId(), Money.ZERO));
		}

		return total;
	}


	private static PaymentList firstMatching(List<PaymentList> lists, boolean tournament) {
		return lists.stream()
				.filter(list -> list.isTournament() == tournament)
				.findFirst()
				.orElse(null);
	}


	/**
	 * A list with no payments yet produces no aggregate row, which is a genuine zero rather than missing data.
	 */
	private static ListSummaryView slot(PaymentList list, Map<UUID, PaymentCounts> counts) {
		if (list == null) {
			return null;
		}

		PaymentCounts totals = counts.get(list.getId());

		return new ListSummaryView(
				list.getId(),
				list.isClosed(),
				totals == null ? 0L : totals.settledCount(),
				totals == null ? 0L : totals.totalCount()
		);
	}


	/**
	 * @return {@code null} when the caller may not read this side of the books, which the client shows as unavailable rather than as zero
	 */
	private static BigDecimal sumTransactions(List<PaymentList> lists, Map<UUID, Map<TransactionType, BigDecimal>> transactions, TransactionType type, Set<TransactionType> readable) {
		if (!readable.contains(type)) {
			return null;
		}

		BigDecimal total = Money.ZERO;

		for (PaymentList list : lists) {
			BigDecimal listTotal = transactions.getOrDefault(list.getId(), Map.of()).get(type);

			if (listTotal != null) {
				total = Money.add(total, listTotal);
			}
		}

		return total;
	}


	private Map<UUID, PaymentCounts> paymentCounts(List<PaymentList> lists) {
		Collection<UUID> ids = idsOf(lists);

		if (ids.isEmpty()) {
			return Map.of();
		}

		return paymentRepository.countByListIds(ids).stream().collect(Collectors.toMap(PaymentCounts::listId, Function.identity()));
	}


	private Map<UUID, BigDecimal> outstandingTotals(List<PaymentList> lists) {
		Collection<UUID> ids = idsOf(lists);

		if (ids.isEmpty()) {
			return Map.of();
		}

		return paymentRepository.sumOutstandingByListIds(ids).stream().collect(Collectors.toMap(PaymentOutstanding::listId, PaymentOutstanding::outstanding));
	}


	private static Map<UUID, BigDecimal> amountsByList(List<PaymentList> lists, Function<Collection<UUID>, List<ListAmount>> query) {
		Collection<UUID> ids = idsOf(lists);

		if (ids.isEmpty()) {
			return Map.of();
		}

		return query.apply(ids).stream().collect(Collectors.toMap(ListAmount::listId, ListAmount::amount));
	}


	private Map<UUID, Map<TransactionType, BigDecimal>> transactionTotals(List<PaymentList> lists, Set<TransactionType> readable) {
		Collection<UUID> ids = idsOf(lists);

		if (ids.isEmpty() || readable.isEmpty()) {
			return Map.of();
		}

		Map<UUID, Map<TransactionType, BigDecimal>> byList = new HashMap<>();

		for (TransactionTotals totals : transactionRepository.sumTotalsByListIds(ids, readable)) {
			byList.computeIfAbsent(totals.listId(), key -> new HashMap<>()).put(totals.type(), totals.total());
		}

		return byList;
	}


	private static Collection<UUID> idsOf(List<PaymentList> lists) {
		return lists.stream().map(PaymentList::getId).toList();
	}


	private Set<TransactionType> readableTypes() {
		Set<TransactionType> readable = EnumSet.noneOf(TransactionType.class);

		for (TransactionType type : TransactionType.values()) {
			if (securityService.hasPermission(type.readPermission())) {
				readable.add(type);
			}
		}

		return readable;
	}
}
