package atomdance.app.modules.audit.service;

import atomdance.app.modules.audit.model.AuditEvent;
import atomdance.app.modules.audit.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AuditEventWriter {

	private final AuditEventRepository repository;

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public void write(AuditEvent event) {
		repository.save(event);
	}
}
