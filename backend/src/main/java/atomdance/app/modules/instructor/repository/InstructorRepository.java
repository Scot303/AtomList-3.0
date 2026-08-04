package atomdance.app.modules.instructor.repository;

import atomdance.app.modules.instructor.model.Instructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InstructorRepository extends JpaRepository<Instructor, UUID> {

	@Query(value = """
			SELECT i FROM Instructor i
			WHERE (:activeOnly = FALSE OR i.isActive = TRUE)
			  AND (:search IS NULL OR LOWER(i.name) LIKE :search OR LOWER(i.lastName) LIKE :search)
			""",
			countQuery = """
					SELECT COUNT(i) FROM Instructor i
					WHERE (:activeOnly = FALSE OR i.isActive = TRUE)
					  AND (:search IS NULL OR LOWER(i.name) LIKE :search OR LOWER(i.lastName) LIKE :search)
					""")
	Page<Instructor> search(@Param("search") String search, @Param("activeOnly") boolean activeOnly, Pageable pageable);

	List<Instructor> findByIsActiveTrue(Sort sort);

	List<Instructor> findByIdIn(Collection<UUID> ids);
}
