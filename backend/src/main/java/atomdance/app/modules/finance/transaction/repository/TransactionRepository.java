package atomdance.app.modules.finance.transaction.repository;

import atomdance.app.modules.finance.paymentList.repository.projection.TransactionTotals;
import atomdance.app.modules.finance.transaction.model.Transaction;
import atomdance.app.modules.finance.transaction.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

	/**
	 * @param types the types the caller is allowed to see
	 */
	@Query("""
			SELECT t FROM Transaction t
			LEFT JOIN FETCH t.instructor
			WHERE t.list.id = :listId AND t.type IN :types
			ORDER BY t.type ASC, t.createdAt ASC
			""")
	List<Transaction> findByListIdAndTypeIn(@Param("listId") UUID listId, @Param("types") Collection<TransactionType> types);

	@Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.instructor LEFT JOIN FETCH t.list WHERE t.id = :id")
	Optional<Transaction> findByIdWithRelations(@Param("id") UUID id);

	@Query("SELECT t.instructor.id FROM Transaction t WHERE t.list.id = :listId AND t.instructor IS NOT NULL")
	List<UUID> findInstructorIdsByListId(@Param("listId") UUID listId);

	@Modifying(flushAutomatically = true)
	@Query("UPDATE Transaction t SET t.instructor = NULL WHERE t.instructor.id = :instructorId")
	int releaseInstructor(@Param("instructorId") UUID instructorId);

	/**
	 * Each list's income and expense sides, summed, for the year overview.
	 */
	@Query("""
			SELECT new atomdance.app.modules.finance.paymentList.repository.projection.TransactionTotals(
				t.list.id, t.type, SUM(t.amount * t.quantity))
			FROM Transaction t
			WHERE t.list.id IN :listIds AND t.type IN :types
			GROUP BY t.list.id, t.type
			""")
	List<TransactionTotals> sumTotalsByListIds(@Param("listIds") Collection<UUID> listIds, @Param("types") Collection<TransactionType> types);

	void deleteByListId(UUID listId);
}
