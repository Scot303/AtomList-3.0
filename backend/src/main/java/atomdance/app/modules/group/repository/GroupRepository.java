package atomdance.app.modules.group.repository;

import atomdance.app.modules.group.model.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface GroupRepository extends JpaRepository<Group, UUID> {

	@Query(value = """
			SELECT g FROM Group g
			WHERE (:activeOnly = FALSE OR g.isActive = TRUE)
			  AND (:search IS NULL OR LOWER(g.name) LIKE :search)
			""",
			countQuery = """
					SELECT COUNT(g) FROM Group g
					WHERE (:activeOnly = FALSE OR g.isActive = TRUE)
					  AND (:search IS NULL OR LOWER(g.name) LIKE :search)
					""")
	Page<Group> search(@Param("search") String search, @Param("activeOnly") boolean activeOnly, Pageable pageable);

	boolean existsByNameIgnoreCase(String name);

	@Query("SELECT COUNT(g) FROM Group g WHERE LOWER(g.name) = LOWER(:name) AND g.id <> :excludedId")
	long countByNameExcluding(@Param("name") String name, @Param("excludedId") UUID excludedId);
}
