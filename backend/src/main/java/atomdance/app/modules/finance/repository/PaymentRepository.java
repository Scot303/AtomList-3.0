package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

	@Query("""
			SELECT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			WHERE p.list.id = :listId
			ORDER BY person.lastName ASC, person.name ASC
			""")
	List<Payment> findByListId(@Param("listId") UUID listId);

	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.lines
			WHERE p.list.id = :listId
			""")
	List<Payment> findByListIdWithLines(@Param("listId") UUID listId);

	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.lines
			WHERE p.id = :id
			""")
	Optional<Payment> findByIdWithLines(@Param("id") UUID id);

	/**
	 * Backs a lookup by the code somebody was given verbally.
	 */
	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.lines
			WHERE p.number = :number
			""")
	Optional<Payment> findByNumberWithLines(@Param("number") Long number);

	@Query("""
			SELECT DISTINCT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			LEFT JOIN FETCH p.lines
			WHERE p.list.id = :listId AND p.person.id IN :personIds
			""")
	List<Payment> findByListIdAndPersonIdsWithLines(@Param("listId") UUID listId, @Param("personIds") Collection<UUID> personIds);

	Optional<Payment> findByListIdAndPersonId(UUID listId, UUID personId);

	@Query("SELECT p.person.id FROM Payment p WHERE p.list.id = :listId")
	List<UUID> findPersonIdsByListId(@Param("listId") UUID listId);

	/**
	 * Everybody still owing on a list.
	 */
	@Query("""
			SELECT p FROM Payment p
			JOIN FETCH p.person person
			LEFT JOIN FETCH person.family
			WHERE p.list.id = :listId
			  AND p.isFakePayment = FALSE
			  AND p.amountPaid < p.amountToPay
			ORDER BY person.lastName ASC, person.name ASC
			""")
	List<Payment> findUnpaidByListId(@Param("listId") UUID listId);

	/**
	 * How much of an overpayment has already been assigned to other months, so the same money cannot be spent twice.
	 */
	@Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM Payment p WHERE p.settledByPayment.id = :paymentId")
	BigDecimal sumAllocatedFrom(@Param("paymentId") UUID paymentId);

	@Query("""
			SELECT p FROM Payment p
			JOIN FETCH p.list
			WHERE p.settledByPayment.id = :paymentId
			ORDER BY p.list.year ASC, p.list.month ASC
			""")
	List<Payment> findAllocationsOf(@Param("paymentId") UUID paymentId);


}
