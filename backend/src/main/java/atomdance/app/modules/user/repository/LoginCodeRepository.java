package atomdance.app.modules.user.repository;

import atomdance.app.modules.user.model.LoginCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LoginCodeRepository extends JpaRepository<LoginCode, Long> {

	/**
	 * The one code a user may currently redeem. Codes are hashed with a slow hash, so they cannot be
	 * looked up by value - the account is the key, and only the newest live code counts.
	 */
	@Query("""
			SELECT c FROM LoginCode c
			WHERE c.user.id = :userId AND c.consumedAt IS NULL AND c.expiresAt > :now
			ORDER BY c.createdAt DESC
			LIMIT 1
			""")
	Optional<LoginCode> findNewestUsable(@Param("userId") UUID userId, @Param("now") Instant now);

	@Query("SELECT MAX(c.createdAt) FROM LoginCode c WHERE c.user.id = :userId")
	Optional<Instant> findLastIssuedAt(@Param("userId") UUID userId);

	@Modifying
	@Query("UPDATE LoginCode c SET c.consumedAt = :now WHERE c.user.id = :userId AND c.consumedAt IS NULL")
	int consumeAllForUser(@Param("userId") UUID userId, @Param("now") Instant now);

	@Modifying
	@Query("DELETE FROM LoginCode c WHERE c.expiresAt < :cutoff")
	int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
}
