package atomdance.app.modules.finance.deposit.repository;

import atomdance.app.modules.finance.deposit.model.Deposit;
import atomdance.app.modules.finance.deposit.model.DepositScope;
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
			LEFT JOIN FETCH d.settlements
			WHERE d.id = :id
			""")
	Optional<Deposit> findByIdWithSettlements(@Param("id") UUID id);

	@Query("""
			SELECT d FROM Deposit d
			LEFT JOIN FETCH d.settlements
			WHERE d.codeYear = :codeYear AND d.number = :number
			""")
	Optional<Deposit> findByCodeWithSettlements(@Param("codeYear") int codeYear, @Param("number") long number);

	@Query("SELECT COALESCE(MAX(d.number), 0) FROM Deposit d WHERE d.codeYear = :codeYear")
	long highestNumberInYear(@Param("codeYear") int codeYear);

	@EntityGraph(attributePaths = "settlements")
	List<Deposit> findAllBy(Sort sort);

	@EntityGraph(attributePaths = "settlements")
	List<Deposit> findByReceivedAtGreaterThanEqualAndReceivedAtLessThan(Instant from, Instant until, Sort sort);

	/**
	 * The cash a month took in, whichever months' debts it went on to clear. A report's income section.
	 */
	@Query("""
			SELECT d FROM Deposit d
			WHERE d.receivedAt >= :from AND d.receivedAt < :until
			  AND d.scope = :scope
			ORDER BY d.receivedAt ASC, d.codeYear ASC, d.number ASC
			""")
	List<Deposit> findReceivedBetween(@Param("from") Instant from, @Param("until") Instant until, @Param("scope") DepositScope scope);

	/**
	 * Every bit of credit still in hand for any of these people, oldest first - so the earliest money is spent first.
	 */
	@Query("""
			SELECT d FROM Deposit d
			LEFT JOIN FETCH d.settlements
			WHERE d.id IN (SELECT covering.id FROM Deposit covering JOIN covering.coveredPersons covered WHERE covered.id IN :personIds)
			  AND d.totalAmount > (SELECT COALESCE(SUM(s.amount), 0) FROM PaymentSettlement s WHERE s.deposit = d)
			ORDER BY d.receivedAt ASC, d.codeYear ASC, d.number ASC
			""")
	List<Deposit> findWithCreditForPersons(@Param("personIds") Collection<UUID> personIds);
}
