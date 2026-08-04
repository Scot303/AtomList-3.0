package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.Transaction;
import atomdance.app.modules.finance.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
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

	void deleteByListId(UUID listId);
}
