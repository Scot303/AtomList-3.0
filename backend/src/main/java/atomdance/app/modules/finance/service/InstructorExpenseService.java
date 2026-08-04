package atomdance.app.modules.finance.service;

import atomdance.app.modules.finance.model.PaymentList;
import atomdance.app.modules.finance.model.Transaction;
import atomdance.app.modules.finance.model.TransactionType;
import atomdance.app.modules.finance.repository.TransactionRepository;
import atomdance.app.modules.instructor.model.Instructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Puts instructors onto a list as expense rows.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InstructorExpenseService {

	private final TransactionRepository transactionRepository;
	private final MessageSource messageSource;

	/**
	 * Creates one expense row per instructor, priced at their hourly rate with the hours left at zero for a manager to fill in as the month goes.
	 *
	 * @return how many rows were created
	 */
	public int seed(PaymentList list, List<Instructor> instructors) {
		Set<UUID> alreadyPresent = new HashSet<>(transactionRepository.findInstructorIdsByListId(list.getId()));
		List<Transaction> created = new java.util.ArrayList<>();

		for (Instructor instructor : instructors) {
			if (alreadyPresent.contains(instructor.getId())) {
				continue;
			}

			created.add(Transaction.builder()
					.list(list)
					.name(expenseName(instructor))
					.type(TransactionType.EXPENSE)
					.amount(instructor.getCostPerHour())
					.quantity(BigDecimal.ZERO)
					.instructor(instructor)
					.build());
		}

		if (created.isEmpty()) {
			return 0;
		}

		transactionRepository.saveAll(created);
		log.info("Seeded {} instructor expense row(s) onto list {}", created.size(), list.getId());

		return created.size();
	}

	/**
	 * Editable afterwards - this is only the starting label.
	 */
	private String expenseName(Instructor instructor) {
		return messageSource.getMessage(
				"list.instructor_expense_name",
				new Object[]{instructor.getName(), instructor.getLastName()},
				instructor.getFullName(),
				LocaleContextHolder.getLocale()
		);
	}
}
