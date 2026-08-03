package atomdance.app.modules.audit.repository;

import atomdance.app.modules.audit.model.AuditEvent;
import atomdance.app.modules.audit.model.AuditEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface AuditEventRepository extends JpaRepository<AuditEvent, Long> {


	List<AuditEvent> findByActorIdOrderByOccurredAtDesc(UUID actorId);

	@Modifying
	@Query("DELETE FROM AuditEvent a WHERE a.type = :type AND a.occurredAt < :cutoff")
	int deleteByTypeOccurredBefore(@Param("type") AuditEventType type, @Param("cutoff") Instant cutoff);
}
