package atomdance.app.modules.activity.service;

import atomdance.app.modules.activity.model.UserActivity;
import atomdance.app.modules.activity.repository.UserActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class UserActivityWriter {

	private final UserActivityRepository repository;

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void write(UserActivity activity) {
		repository.save(activity);
	}
}
