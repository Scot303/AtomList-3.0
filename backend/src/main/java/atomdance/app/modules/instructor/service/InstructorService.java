package atomdance.app.modules.instructor.service;

import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.utils.SearchPatterns;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.model.AuditOutcome;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.instructor.dto.CreateInstructorRequest;
import atomdance.app.modules.instructor.dto.InstructorView;
import atomdance.app.modules.instructor.dto.UpdateInstructorRequest;
import atomdance.app.modules.instructor.model.Instructor;
import atomdance.app.modules.instructor.repository.InstructorRepository;
import atomdance.app.modules.user.service.SecurityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstructorService {

	private static final Sort BY_NAME = Sort.by("lastName", "name");

	private final InstructorRepository instructorRepository;
	private final SecurityService securityService;
	private final AuditLogger auditLogger;

	public Instructor getOrThrow(UUID id) {
		return instructorRepository.findById(id)
				.orElseThrow(() -> new NotFoundException("entity.instructor"));
	}

	@Transactional(readOnly = true)
	public Page<InstructorView> getAll(String search, boolean activeOnly, Pageable pageable) {
		auditLogger.record(securityService.getCurrentUserId(), AuditEventType.INSTRUCTOR_PREVIEW, AuditOutcome.SUCCESS, "Previewed all instructors.");
		return instructorRepository.search(SearchPatterns.contains(search), activeOnly, pageable).map(InstructorView::from);
	}

	@Transactional(readOnly = true)
	public InstructorView get(UUID id) {
		auditLogger.record(securityService.getCurrentUserId(), id, AuditEventType.INSTRUCTOR_PREVIEW, AuditOutcome.SUCCESS, "Previewed instructor data.");
		return InstructorView.from(getOrThrow(id));
	}

	public List<Instructor> findActive() {
		return instructorRepository.findByIsActiveTrue(BY_NAME);
	}

	/**
	 * @throws NotFoundException if any id does not resolve, rather than silently seeding a shorter list
	 */
	public List<Instructor> findAllOrThrow(List<UUID> ids) {
		List<Instructor> instructors = instructorRepository.findByIdIn(ids);

		if (instructors.size() != ids.stream().distinct().count()) {
			throw new NotFoundException("entity.instructor");
		}

		return instructors;
	}

	@Transactional
	public InstructorView create(CreateInstructorRequest request) {
		Instructor instructor = instructorRepository.saveAndFlush(Instructor.builder()
				.name(request.name().trim())
				.lastName(request.lastName().trim())
				.costPerHour(request.costPerHour())
				.contractSignedDate(request.contractSignedDate())
				.contractNumber(request.contractNumber())
				.isActive(request.active() == null || request.active())
				.note(request.note())
				.build());

		log.info("Created instructor {} ({}) at {} per hour", instructor.getId(), instructor.getFullName(), instructor.getCostPerHour());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), instructor.getId(), AuditEventType.INSTRUCTOR_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Instructor %s has been created at %s per hour.",
				instructor.getFullName(), instructor.getCostPerHour()));

		return InstructorView.from(instructor);
	}

	/**
	 * Partial update - a {@code null} field is left alone.
	 */
	@Transactional
	public InstructorView update(UUID id, UpdateInstructorRequest request) {
		Instructor instructor = getOrThrow(id);

		if (request.name() != null) {
			instructor.setName(request.name().trim());
		}

		if (request.lastName() != null) {
			instructor.setLastName(request.lastName().trim());
		}

		if (request.costPerHour() != null && instructor.getCostPerHour().compareTo(request.costPerHour()) != 0) {
			log.info("Changed hourly rate on instructor {} from {} to {}", instructor.getId(), instructor.getCostPerHour(), request.costPerHour());
			auditLogger.recordOnCommit(securityService.getCurrentUserId(), instructor.getId(), AuditEventType.INSTRUCTOR_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Instructor %s hourly rate changed from %s to %s.",
					instructor.getFullName(), instructor.getCostPerHour(), request.costPerHour()));

			instructor.setCostPerHour(request.costPerHour());
		}

		if (request.contractSignedDate() != null) {
			instructor.setContractSignedDate(request.contractSignedDate());
		}

		if (request.contractNumber() != null) {
			instructor.setContractNumber(request.contractNumber());
		}

		if (request.active() != null) {
			instructor.setActive(request.active());
		}

		if (request.note() != null) {
			instructor.setNote(request.note());
		}

		auditLogger.recordOnCommit(securityService.getCurrentUserId(), instructor.getId(), AuditEventType.INSTRUCTOR_MANAGEMENT, AuditOutcome.SUCCESS, "Instructor has been changed.");

		return InstructorView.from(instructor);
	}

	@Transactional
	public void delete(UUID id) {
		Instructor instructor = getOrThrow(id);

		instructorRepository.delete(instructor);

		log.info("Deleted instructor {} ({})", instructor.getId(), instructor.getFullName());
		auditLogger.recordOnCommit(securityService.getCurrentUserId(), instructor.getId(), AuditEventType.INSTRUCTOR_MANAGEMENT, AuditOutcome.SUCCESS, String.format("Instructor %s has been deleted.", instructor.getFullName()));
	}
}
