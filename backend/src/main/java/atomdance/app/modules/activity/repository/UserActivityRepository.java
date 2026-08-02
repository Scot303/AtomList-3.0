package atomdance.app.modules.activity.repository;

import atomdance.app.modules.activity.model.ActivityType;
import atomdance.app.modules.activity.model.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {


	List<UserActivity> findByUserIdOrderByOccurredAtDesc(UUID userId);

	@Modifying
	@Query("DELETE FROM UserActivity a WHERE a.type = :type AND a.occurredAt < :cutoff")
	int deleteByTypeOccurredBefore(@Param("type") ActivityType type, @Param("cutoff") Instant cutoff);
}
