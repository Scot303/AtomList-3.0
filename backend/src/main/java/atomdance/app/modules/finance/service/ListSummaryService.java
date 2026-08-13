package atomdance.app.modules.finance.service;

import atomdance.app.common.utils.Money;
import atomdance.app.modules.finance.dto.ListSummaryView;
import atomdance.app.modules.finance.dto.MonthSummaryView;
import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.model.TransactionType;
import atomdance.app.modules.finance.repository.PaymentListRepository;
import atomdance.app.modules.finance.repository.PaymentRepository;
import atomdance.app.modules.finance.repository.TransactionRepository;
import atomdance.app.modules.finance.repository.projection.PaymentCounts;
import atomdance.app.modules.finance.repository.projection.PaymentOutstanding;
import atomdance.app.modules.finance.repository.projection.TransactionTotals;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * A year of standard lists at a glance: what each month billed, what it has settled, and what surrounds it.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ListSummaryService {

	private static final int MONTHS = 12;

	private final PaymentListRepository paymentListRepository;
	private final PaymentRepository paymentRepository;
	private final TransactionRepository transactionRepository;
	private final SecurityService securityService;


	@Transactional(readOnly = true)
	public List<MonthSummaryView> summariseYear(int year) {
		List<PaymentList> lists = paymentListRepository.findByYearAndTypeIn(year, ListType.standardTypes());

		Set<TransactionType> readable = readableTypes();

		Map<UUID, PaymentCounts> counts = paymentCounts(lists);
		Map<UUID, BigDecimal> outstanding = outstandingTotals(lists);
		Map<UUID, Map<TransactionType, BigDecimal>> transactions = transactionTotals(lists, readable);

		Map<Integer, List<PaymentList>> byMonth = lists.stream().collect(Collectors.groupingBy(PaymentList::getMonth));

		List<MonthSummaryView> months = new ArrayList<>(MONTHS);

		for (int month = 1; month <= MONTHS; month++) {
			months.add(summarise(year, month, byMonth.getOrDefault(month, List.of()), counts, outstanding, transactions, readable));
		}

		return months;
	}


	private MonthSummaryView summarise(int year, int month, List<PaymentList> lists, Map<UUID, PaymentCounts> counts, Map<UUID, BigDecimal> outstanding, Map<UUID, Map<TransactionType, BigDecimal>> transactions, Set<TransactionType> readable) {
		PaymentList tournament = firstMatching(lists, true);
		PaymentList open = firstMatching(lists, false);

		BigDecimal owed = Money.ZERO;

		for (PaymentList list : lists) {
			owed = Money.add(owed, outstanding.getOrDefault(list.getId(), Money.ZERO));
		}

		return new MonthSummaryView(
				year,
				month,
				slot(tournament, counts),
				slot(open, counts),
				owed,
				sumTransactions(lists, transactions, TransactionType.EXPENSE, readable),
				sumTransactions(lists, transactions, TransactionType.INCOME, readable)
		);
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
