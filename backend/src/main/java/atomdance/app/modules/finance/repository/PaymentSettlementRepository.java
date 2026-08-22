package atomdance.app.modules.finance.repository;

import atomdance.app.modules.finance.model.PaymentSettlement;
import atomdance.app.modules.finance.repository.projection.ListAmount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface PaymentSettlementRepository extends JpaRepository<PaymentSettlement, UUID> {

	@Query("""
			SELECT s FROM PaymentSettlement s
			JOIN FETCH s.payment payment
			JOIN FETCH payment.person
			JOIN FETCH payment.list
			JOIN FETCH s.deposit
			WHERE s.id = :id
			""")
	Optional<PaymentSettlement> findByIdWithRelations(@Param("id") UUID id);

	@Query("""
			SELECT s FROM PaymentSettlement s
			JOIN FETCH s.payment payment
			JOIN FETCH payment.person person
			LEFT JOIN FETCH payment.group
			JOIN FETCH payment.list
			WHERE s.deposit.id = :depositId
			ORDER BY payment.list.year ASC, payment.list.month ASC, person.lastName ASC, person.name ASC, payment.number ASC, s.number ASC
			""")
	List<PaymentSettlement> findByDepositId(@Param("depositId") UUID depositId);

	/**
	 * What was actually collected on each list: real money, booked to this list's own month.
	 * <p>
	 * Clearances are excluded. Their cash is reported in the month their deposit was booked to.
	 */
	@Query("""
			SELECT new atomdance.app.modules.finance.repository.projection.ListAmount(
				s.payment.list.id,
				SUM(s.amount))
			FROM PaymentSettlement s
			WHERE s.payment.list.id IN :listIds
			  AND s.isCarryingMoney = TRUE
			GROUP BY s.payment.list.id
			""")
	List<ListAmount> sumCollectedByListIds(@Param("listIds") Collection<UUID> listIds);

	/**
	 * What was settled on each list out of another month's money - reported as income there, not here.
	 */
	@Query("""
			SELECT new atomdance.app.modules.finance.repository.projection.ListAmount(
				s.payment.list.id,
				SUM(s.amount))
			FROM PaymentSettlement s
			WHERE s.payment.list.id IN :listIds
			  AND s.isCarryingMoney = FALSE
			GROUP BY s.payment.list.id
			""")
	List<ListAmount> sumClearedByListIds(@Param("listIds") Collection<UUID> listIds);
}
