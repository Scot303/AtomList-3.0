package atomdance.app.modules.sms.repository;

import atomdance.app.modules.sms.model.Sms;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


@Repository
public interface SmsRepository extends JpaRepository<Sms, UUID> {

	/**
	 * The whole history, newest first, with both possible recipients in hand.
	 */
	@Query("""
			SELECT s FROM Sms s
			LEFT JOIN FETCH s.person
			LEFT JOIN FETCH s.family
			ORDER BY s.createdAt DESC
			""")
	List<Sms> findAllWithRecipients();
}
