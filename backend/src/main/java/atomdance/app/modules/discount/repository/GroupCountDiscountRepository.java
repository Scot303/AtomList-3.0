package atomdance.app.modules.discount.repository;

import atomdance.app.modules.discount.model.GroupCountDiscount;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GroupCountDiscountRepository extends JpaRepository<GroupCountDiscount, UUID> {

	List<GroupCountDiscount> findAll(Sort sort);

	Optional<GroupCountDiscount> findByGroupCount(int groupCount);

}
