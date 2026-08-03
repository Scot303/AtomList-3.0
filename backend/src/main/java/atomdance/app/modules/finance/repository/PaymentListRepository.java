package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentList;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentListRepository extends JpaRepository<PaymentList, UUID> {

	Optional<PaymentList> findByYearAndMonthAndType(Integer year, Integer month, ListType type);

	boolean existsByYearAndMonthAndType(Integer year, Integer month, ListType type);

	@Query("SELECT l FROM PaymentList l LEFT JOIN FETCH l.sourceList WHERE l.id = :id")
	Optional<PaymentList> findByIdWithSource(@Param("id") UUID id);

	@Query(value = """
			SELECT l FROM PaymentList l
			WHERE (:type IS NULL OR l.type = :type) AND (:year IS NULL OR l.year = :year)
			""",
			countQuery = """
					SELECT COUNT(l) FROM PaymentList l
					WHERE (:type IS NULL OR l.type = :type) AND (:year IS NULL OR l.year = :year)
					""")
	Page<PaymentList> search(@Param("type") ListType type, @Param("year") Integer year, Pageable pageable);

	/**
	 * Standard lists a person still owes money on, oldest first.
	 * Rows already marked as fake are excluded: a month settled out of another month's overpayment is
	 * dealt with, and offering it again would let the same debt be covered twice.
	 */
	@Query("""
			SELECT l FROM PaymentList l
			JOIN Payment p ON p.list = l
			WHERE l.type IN (ListType.STANDARD, ListType.STANDARD_TOURNAMENT)
			  AND p.person.id = :personId
			  AND p.isFakePayment = FALSE
			  AND p.amountPaid < p.amountToPay
			  AND l.id <> :excludedListId
			ORDER BY l.year ASC, l.month ASC, l.type ASC
			""")
	List<PaymentList> findStandardListsWithDebtFor(@Param("personId") UUID personId, @Param("excludedListId") UUID excludedListId);

}
