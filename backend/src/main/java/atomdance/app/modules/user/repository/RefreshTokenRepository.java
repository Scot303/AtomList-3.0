package atomdance.app.modules.user.repository;

import atomdance.app.modules.user.model.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	@Query("SELECT t FROM RefreshToken t JOIN FETCH t.user WHERE t.tokenHash = :tokenHash")
	Optional<RefreshToken> findByTokenHashWithUser(@Param("tokenHash") String tokenHash);

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	@Modifying
	@Query("UPDATE RefreshToken t SET t.revokedAt = :now WHERE t.user.id = :userId AND t.revokedAt IS NULL")
	int revokeAllForUser(@Param("userId") UUID userId, @Param("now") Instant now);

	@Modifying
	@Query("DELETE FROM RefreshToken t WHERE t.expiresAt < :cutoff")
	int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
}