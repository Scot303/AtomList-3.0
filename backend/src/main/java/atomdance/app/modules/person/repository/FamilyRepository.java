package atomdance.app.modules.person.repository;

import atomdance.app.modules.person.model.Family;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface FamilyRepository extends JpaRepository<Family, UUID> {


	@Query("SELECT f FROM Family f LEFT JOIN FETCH f.persons WHERE f.id = :id")
	Optional<Family> findByIdWithPersons(@Param("id") UUID id);

	@Query(value = "SELECT DISTINCT f FROM Family f LEFT JOIN FETCH f.persons " +
			"WHERE :search IS NULL OR LOWER(f.name) LIKE :search",
			countQuery = "SELECT COUNT(f) FROM Family f " +
					"WHERE :search IS NULL OR LOWER(f.name) LIKE :search"
	)
	Page<Family> search(@Param("search") String search, Pageable pageable);
}
