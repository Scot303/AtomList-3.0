package atomdance.app.modules.user.repository;

import atomdance.app.modules.user.model.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

	@Query("SELECT t FROM EmailVerificationToken t JOIN FETCH t.user WHERE t.tokenHash = :tokenHash")
	Optional<EmailVerificationToken> findByTokenHashWithUser(@Param("tokenHash") String tokenHash);

	@Query("SELECT MAX(t.createdAt) FROM EmailVerificationToken t WHERE t.user.id = :userId")
	Optional<Instant> findLastIssuedAt(@Param("userId") UUID userId);

	@Modifying
	@Query("UPDATE EmailVerificationToken t SET t.consumedAt = :now WHERE t.user.id = :userId AND t.consumedAt IS NULL")
	int consumeAllForUser(@Param("userId") UUID userId, @Param("now") Instant now);

	@Modifying
	@Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < :cutoff")
	int deleteExpiredBefore(@Param("cutoff") Instant cutoff);
}
