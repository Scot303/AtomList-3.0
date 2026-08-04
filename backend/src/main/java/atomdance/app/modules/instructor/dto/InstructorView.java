package atomdance.app.modules.instructor.dto;

import atomdance.app.modules.instructor.model.Instructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record InstructorView(
		UUID id,
		String name,
		String lastName,
		String fullName,
		BigDecimal costPerHour,
		LocalDate contractSignedDate,
		String contractNumber,
		boolean active,
		String note
) {

	public static InstructorView from(Instructor instructor) {
		return new InstructorView(
				instructor.getId(),
				instructor.getName(),
				instructor.getLastName(),
				instructor.getFullName(),
				instructor.getCostPerHour(),
				instructor.getContractSignedDate(),
				instructor.getContractNumber(),
				instructor.isActive(),
				instructor.getNote()
		);
	}
}
