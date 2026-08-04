package atomdance.app.modules.group.repository;

import atomdance.app.modules.group.model.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

	/**
	 * Everything the payment calculator needs in one query - the group for its price and billing type, the person and their family for the discount order.
	 */
	@Query("""
			SELECT m FROM Membership m
			JOIN FETCH m.group g
			JOIN FETCH m.person p
			LEFT JOIN FETCH p.family
			WHERE m.joinedAt <= :monthEnd
			  AND (m.leftAt IS NULL OR m.leftAt >= :monthStart)
			  AND (:activePersonsOnly = FALSE OR p.isActive = TRUE)
			""")
	List<Membership> findActiveDuring(@Param("monthStart") LocalDate monthStart, @Param("monthEnd") LocalDate monthEnd, @Param("activePersonsOnly") boolean activePersonsOnly);

	/**
	 * As {@link #findActiveDuring}, narrowed to specific people. Used when recalculating one familyrather than a whole list.
	 */
	@Query("""
			SELECT m FROM Membership m
			JOIN FETCH m.group g
			JOIN FETCH m.person p
			LEFT JOIN FETCH p.family
			WHERE m.person.id IN :personIds
			  AND m.joinedAt <= :monthEnd
			  AND (m.leftAt IS NULL OR m.leftAt >= :monthStart)
			""")
	List<Membership> findActiveDuringForPersons(@Param("personIds") Collection<UUID> personIds, @Param("monthStart") LocalDate monthStart, @Param("monthEnd") LocalDate monthEnd);

	@Query("""
			SELECT m FROM Membership m
			JOIN FETCH m.group
			JOIN FETCH m.person
			WHERE m.person.id = :personId
			ORDER BY m.joinedAt DESC
			""")
	List<Membership> findByPersonId(@Param("personId") UUID personId);

	@Query("SELECT m FROM Membership m JOIN FETCH m.group JOIN FETCH m.person LEFT JOIN FETCH m.person.family WHERE m.id = :id")
	Optional<Membership> findByIdWithRelations(@Param("id") UUID id);

	/**
	 * Somebody may attend a group once at a time.
	 */
	@Query("SELECT COUNT(m) > 0 FROM Membership m WHERE m.person.id = :personId AND m.group.id = :groupId AND m.leftAt IS NULL")
	boolean existsActiveForPersonAndGroup(@Param("personId") UUID personId, @Param("groupId") UUID groupId);

	/**
	 * People currently attending any of the given groups. Backs {@code BY_GROUPS} custom-list
	 * population.
	 */
	@Query("""
			SELECT DISTINCT m.person.id FROM Membership m
			WHERE m.group.id IN :groupIds
			  AND m.leftAt IS NULL
			  AND m.person.isActive = TRUE
			""")
	List<UUID> findActivePersonIdsInGroups(@Param("groupIds") Collection<UUID> groupIds);

	long countByGroupId(UUID groupId);

}
