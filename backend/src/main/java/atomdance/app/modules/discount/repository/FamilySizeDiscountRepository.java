package atomdance.app.modules.discount.repository;

import atomdance.app.modules.discount.model.FamilySizeDiscount;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FamilySizeDiscountRepository extends JpaRepository<FamilySizeDiscount, UUID> {

	List<FamilySizeDiscount> findAll(Sort sort);

	Optional<FamilySizeDiscount> findByPosition(int position);

}
