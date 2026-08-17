package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.Deposit;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
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

	@EntityGraph(attributePaths = {"payer", "payer.family", "settlements"})
	List<Deposit> findAllBy(Sort sort);

	@EntityGraph(attributePaths = {"payer", "payer.family", "settlements"})
	List<Deposit> findByReceivedAtGreaterThanEqualAndReceivedAtLessThan(Instant from, Instant until, Sort sort);

	/**
	 * The cash a month took in, whichever months' debts it went on to clear. A report's income section.
	 */
	@Query("""
			SELECT d FROM Deposit d
			JOIN FETCH d.payer payer
			LEFT JOIN FETCH payer.family
			WHERE d.receivedAt >= :from AND d.receivedAt < :until
			ORDER BY d.receivedAt ASC, d.number ASC
			""")
	List<Deposit> findReceivedBetween(@Param("from") Instant from, @Param("until") Instant until);

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

	/**
	 * Every bit of credit still in hand for any of these people, oldest first - so the earliest money is spent first.
	 */
	@Query("""
			SELECT DISTINCT d FROM Deposit d
			JOIN FETCH d.payer payer
			LEFT JOIN FETCH payer.family
			LEFT JOIN FETCH d.settlements
			JOIN d.coveredPersonIds coveredId
			WHERE coveredId IN :personIds
			  AND d.totalAmount > (SELECT COALESCE(SUM(s.amount), 0) FROM PaymentSettlement s WHERE s.deposit = d)
			ORDER BY d.receivedAt ASC, d.number ASC
			""")
	List<Deposit> findWithCreditForPersons(@Param("personIds") Collection<UUID> personIds);
}
