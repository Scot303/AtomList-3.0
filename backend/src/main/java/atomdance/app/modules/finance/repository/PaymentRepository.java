package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.Payment;
import atomdance.app.modules.finance.repository.projection.ListAmount;
import atomdance.app.modules.finance.repository.projection.PaymentCounts;
import atomdance.app.modules.finance.repository.projection.PaymentOutstanding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface PaymentRepository extends JpaRepository<Payment, UUID> {

	@Query("""
			SELECT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.group
			WHERE p.list.id = :listId
			ORDER BY person.lastName ASC, person.name ASC, p.description ASC
			""")
	List<Payment> findByListId(@Param("listId") UUID listId);

	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.group
			LEFT JOIN FETCH p.membership
			WHERE p.list.id = :listId
			""")
	List<Payment> findByListIdForCalculation(@Param("listId") UUID listId);

	/**
	 * A whole list with the money detail a report needs, in one query.
	 */
	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.group
			LEFT JOIN FETCH p.settlements settlement
			LEFT JOIN FETCH settlement.deposit deposit
			LEFT JOIN FETCH deposit.payer
			WHERE p.list.id = :listId
			""")
	List<Payment> findByListIdWithSettlements(@Param("listId") UUID listId);

	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.group
			LEFT JOIN FETCH p.list
			LEFT JOIN FETCH p.settlements settlement
			LEFT JOIN FETCH settlement.deposit
			WHERE p.id = :id
			""")
	Optional<Payment> findByIdWithSettlements(@Param("id") UUID id);

	/**
	 * Backs a lookup by the code somebody was given verbally.
	 */
	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.group
			LEFT JOIN FETCH p.list
			LEFT JOIN FETCH p.settlements settlement
			LEFT JOIN FETCH settlement.deposit
			WHERE p.number = :number
			""")
	Optional<Payment> findByNumberWithSettlements(@Param("number") Long number);

	/**
	 * Everything the given people still owe on the monthly sheets of one kind, oldest month first, which is the order a deposit is spent in.
	 * <p>
	 * Narrowed to one {@code type} on purpose. Tournament money and ordinary class money are kept apart, so a
	 * handover taken for one sheet must never be proposed against the other's debts.
	 */
	@Query("""
			SELECT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.group
			JOIN FETCH p.list list
			WHERE p.person.id IN :personIds
			  AND list.type = :type
			  AND p.amountToPay > p.amountSettled
			ORDER BY list.year ASC, list.month ASC, person.lastName ASC, person.name ASC, p.number ASC
			""")
	List<Payment> findOutstandingStandardForPersons(@Param("personIds") Collection<UUID> personIds, @Param("type") ListType type);

	@Query("SELECT p.person.id FROM Payment p WHERE p.list.id = :listId")
	List<UUID> findPersonIdsByListId(@Param("listId") UUID listId);

	/**
	 * Everybody still owing on a list.
	 */
	@Query("""
			SELECT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.group
			WHERE p.list.id = :listId
			  AND p.amountToPay > p.amountSettled
			ORDER BY person.lastName ASC, person.name ASC
			""")
	List<Payment> findUnpaidByListId(@Param("listId") UUID listId);

	/**
	 * How many rows each list holds and how many are dealt with, for the year overview.
	 */
	@Query("""
			SELECT new atomdance.app.modules.finance.repository.projection.PaymentCounts(
				p.list.id,
				COUNT(p),
				COUNT(CASE WHEN p.amountSettled >= p.amountToPay THEN 1 END))
			FROM Payment p
			WHERE p.list.id IN :listIds
			GROUP BY p.list.id
			""")
	List<PaymentCounts> countByListIds(@Param("listIds") Collection<UUID> listIds);

	/**
	 * What each list is still owed, for the year overview..
	 */
	@Query("""
			SELECT new atomdance.app.modules.finance.repository.projection.PaymentOutstanding(
				p.list.id,
				SUM(CAST(p.amountToPay - p.amountSettled AS BigDecimal)))
			FROM Payment p
			WHERE p.list.id IN :listIds
			  AND p.amountToPay > p.amountSettled
			GROUP BY p.list.id
			""")
	List<PaymentOutstanding> sumOutstandingByListIds(@Param("listIds") Collection<UUID> listIds);

	/**
	 * What each list billed, counting every row - what a month charged is a fact about that month, whoever ended up paying it and when.
	 */
	@Query("""
			SELECT new atomdance.app.modules.finance.repository.projection.ListAmount(
				p.list.id,
				SUM(p.amountToPay))
			FROM Payment p
			WHERE p.list.id IN :listIds
			GROUP BY p.list.id
			""")
	List<ListAmount> sumBilledByListIds(@Param("listIds") Collection<UUID> listIds);

	/**
	 * @return whether anybody has paid anything towards this list, which is what stops it being deleted
	 */
	@Query("SELECT COUNT(s) > 0 FROM PaymentSettlement s WHERE s.payment.list.id = :listId")
	boolean hasSettlementsOnList(@Param("listId") UUID listId);
}
