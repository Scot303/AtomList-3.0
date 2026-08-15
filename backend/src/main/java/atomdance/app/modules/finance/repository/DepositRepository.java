package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.Deposit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface DepositRepository extends JpaRepository<Deposit, UUID> {

	@Query("""
			SELECT d FROM Deposit d
			JOIN FETCH d.payer payer
			LEFT JOIN FETCH payer.family
			LEFT JOIN FETCH d.settlements
			WHERE d.id = :id
			""")
	Optional<Deposit> findByIdWithSettlements(@Param("id") UUID id);

	@Query("""
			SELECT d FROM Deposit d
			JOIN FETCH d.payer payer
			LEFT JOIN FETCH payer.family
			LEFT JOIN FETCH d.settlements
			WHERE d.number = :number
			""")
	Optional<Deposit> findByNumberWithSettlements(@Param("number") Long number);

	/*
	 * The history a manager scrolls, in the four shapes its filters come in.
	 */

	@EntityGraph(attributePaths = {"payer", "payer.family"})
	Page<Deposit> findAllBy(Pageable pageable);

	@EntityGraph(attributePaths = {"payer", "payer.family"})
	Page<Deposit> findByPayerId(UUID payerId, Pageable pageable);

	@EntityGraph(attributePaths = {"payer", "payer.family"})
	Page<Deposit> findByBookedYearAndBookedMonth(Integer bookedYear, Integer bookedMonth, Pageable pageable);

	@EntityGraph(attributePaths = {"payer", "payer.family"})
	Page<Deposit> findByPayerIdAndBookedYearAndBookedMonth(UUID payerId, Integer bookedYear, Integer bookedMonth, Pageable pageable);

	/**
	 * The cash a month took in, whichever months' debts it went on to clear. A report's income section.
	 */
	@Query("""
			SELECT d FROM Deposit d
			JOIN FETCH d.payer payer
			LEFT JOIN FETCH payer.family
			WHERE d.bookedYear = :year AND d.bookedMonth = :month
			ORDER BY d.receivedAt ASC, d.number ASC
			""")
	List<Deposit> findBookedFor(@Param("year") int year, @Param("month") int month);

	/**
	 * Credit somebody still has in hand, oldest first so the earliest money is spent first.
	 */
	@Query("""
			SELECT d FROM Deposit d
			JOIN FETCH d.payer
			WHERE d.payer.id = :payerId
			  AND d.totalAmount > (SELECT COALESCE(SUM(s.amount), 0) FROM PaymentSettlement s WHERE s.deposit = d)
			ORDER BY d.receivedAt ASC, d.number ASC
			""")
	List<Deposit> findWithCreditFor(@Param("payerId") UUID payerId);
}
