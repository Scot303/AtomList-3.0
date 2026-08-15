package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.ListType;
import atomdance.app.modules.finance.model.PaymentList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface PaymentListRepository extends JpaRepository<PaymentList, UUID> {

	Optional<PaymentList> findByYearAndMonthAndType(Integer year, Integer month, ListType type);

	List<PaymentList> findByYearAndTypeIn(Integer year, Collection<ListType> types);

	@Query("SELECT l FROM PaymentList l LEFT JOIN FETCH l.sourceList WHERE l.id = :id")
	Optional<PaymentList> findByIdWithSource(@Param("id") UUID id);

	/**
	 * The monthly sheets still being worked on, oldest first.
	 */
	@Query("""
			SELECT l FROM PaymentList l
			WHERE l.status = ListStatus.OPEN
			  AND l.type IN (ListType.STANDARD, ListType.STANDARD_TOURNAMENT)
			ORDER BY l.year ASC, l.month ASC, l.type ASC
			""")
	List<PaymentList> findOpenStandard();

	/**
	 * The monthly sheets for one month, so a report can see the whole month's cash even when only one of the two sheets is being printed.
	 */
	@Query("""
			SELECT l FROM PaymentList l
			WHERE l.year = :year AND l.month = :month
			  AND l.type IN (ListType.STANDARD, ListType.STANDARD_TOURNAMENT)
			ORDER BY l.type ASC
			""")
	List<PaymentList> findStandardFor(@Param("year") int year, @Param("month") int month);

}
