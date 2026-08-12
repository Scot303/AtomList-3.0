package atomdance.app.modules.instructor.repository;

import atomdance.app.modules.instructor.model.Instructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InstructorRepository extends JpaRepository<Instructor, UUID> {

	List<Instructor> findByIsActiveTrue(Sort sort);

	List<Instructor> findByIdIn(Collection<UUID> ids);
}
