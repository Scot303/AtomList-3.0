package atomdance.app.modules.user.repository;

import atomdance.app.modules.user.model.Role;
import atomdance.app.modules.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByUsername(String username);

	@Query("SELECT u FROM User u LEFT JOIN FETCH u.additionalPermissions WHERE u.id = :id")
	Optional<User> findByIdWithPermissions(@Param("id") UUID id);

	@Query("SELECT u FROM User u LEFT JOIN FETCH u.additionalPermissions WHERE u.username = :username")
	Optional<User> findByUsernameWithPermissions(@Param("username") String username);

	/**
	 * Resolves whoever is trying to sign in. Either their username or their email address is accepted,
	 * because the people using this app will not reliably remember which one they were given.
	 */
	@Query("""
			SELECT u FROM User u LEFT JOIN FETCH u.additionalPermissions
			WHERE LOWER(u.username) = :identifier OR u.email = :identifier
			""")
	Optional<User> findByUsernameOrEmailWithPermissions(@Param("identifier") String identifier);

	boolean existsByUsernameIgnoreCase(String username);

	boolean existsByEmail(String email);

	/**
	 * Counts the administrators who would still be able to sign in if the given account were changed.
	 * Guards the last-admin rule - without it one careless edit locks everybody out of user management
	 * permanently, with no way back short of a database console.
	 */
	@Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isActive = TRUE AND u.id <> :excludedId")
	long countActiveByRoleExcluding(@Param("role") Role role, @Param("excludedId") UUID excludedId);

	/**
	 * Invalidates every access token already minted for this user. Done as an atomic increment in the
	 * database rather than a read-modify-write, so two concurrent bumps cannot land on the same value.
	 */
	@Modifying
	@Query("UPDATE User u SET u.tokenVersion = u.tokenVersion + 1 WHERE u.id = :userId")
	int bumpTokenVersion(@Param("userId") UUID userId);
}
