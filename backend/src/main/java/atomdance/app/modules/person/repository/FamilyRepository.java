package atomdance.app.modules.person.repository;

import atomdance.app.modules.person.model.Family;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FamilyRepository extends JpaRepository<Family, UUID> {


	@Query("SELECT f FROM Family f LEFT JOIN FETCH f.persons WHERE f.id = :id")
	Optional<Family> findByIdWithPersons(@Param("id") UUID id);

	@Query("SELECT DISTINCT f FROM Family f LEFT JOIN FETCH f.persons ORDER BY f.name ASC")
	List<Family> findAllWithPersons();
}
