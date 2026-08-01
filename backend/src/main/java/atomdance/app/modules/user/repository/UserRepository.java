package atomdance.app.modules.user.repository;

import atomdance.app.modules.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByUsername(String username);

}
