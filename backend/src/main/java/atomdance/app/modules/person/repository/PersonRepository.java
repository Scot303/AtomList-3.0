package atomdance.app.modules.person.repository;

import atomdance.app.modules.person.model.Person;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonRepository extends JpaRepository<Person, UUID> {

	@Query("SELECT p FROM Person p LEFT JOIN FETCH p.family WHERE p.id = :id")
	Optional<Person> findByIdWithFamily(@Param("id") UUID id);

	@Query(value = """
			SELECT p FROM Person p LEFT JOIN FETCH p.family
			WHERE (:activeOnly = FALSE OR p.isActive = TRUE)
			  AND (:search IS NULL
			       OR LOWER(p.name) LIKE :search
			       OR LOWER(p.lastName) LIKE :search)
			""",
			countQuery = """
					SELECT COUNT(p) FROM Person p
					WHERE (:activeOnly = FALSE OR p.isActive = TRUE)
					  AND (:search IS NULL
					       OR LOWER(p.name) LIKE :search
					       OR LOWER(p.lastName) LIKE :search)
					""")
	Page<Person> search(@Param("search") String search, @Param("activeOnly") boolean activeOnly, Pageable pageable);

	@Query("SELECT p FROM Person p LEFT JOIN FETCH p.family WHERE p.id IN :ids")
	List<Person> findAllByIdWithFamily(@Param("ids") Collection<UUID> ids);

	long countByFamilyId(UUID familyId);
}
