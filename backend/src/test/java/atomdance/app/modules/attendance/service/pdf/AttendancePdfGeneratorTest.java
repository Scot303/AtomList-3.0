package atomdance.app.modules.attendance.service.pdf;

import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.model.Person;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.stubbing.Answer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AttendancePdfGeneratorTest {
    private final AppClock appClock = new AppClock("Europe/Warsaw");
    private final MembershipRepository membershipRepository = mock(MembershipRepository.class);
    private static AttendancePdfGenerator attendancePdfGenerator;

    @BeforeEach
    void setupGenerator() {
        attendancePdfGenerator = new AttendancePdfGenerator(appClock, membershipRepository);
    }

    @Test
    void shouldSuccessfullyGetResourcesFromClasspathAndGeneratePdfBytes() throws IOException {
        // given
        var group = Group.builder()
                .id(UUID.randomUUID())
                .name("Grupa 1")
                .build();
        // when
        when(membershipRepository.findActivePersonsInGroup(group.getId()))
                .thenAnswer((Answer<List<Person>>) invocation -> mockPersons());

        var pdfBytes = attendancePdfGenerator.generateAttendancePdf(group);

        assertThat(pdfBytes)
                .isNotNull();

        // visually check the result saved to backend folder
        Files.write(Paths.get("attendance-test-output.pdf"), pdfBytes);

    }

    private List<Person> mockPersons() {
        return List.of(
                Person.builder().name("Kornel").lastName("Marciniak").build(),
                Person.builder().name("Amelia").lastName("Szymańska").build(),
                Person.builder().name("Pola").lastName("Król").build(),
                Person.builder().name("Noemi").lastName("Szulc").build(),
                Person.builder().name("Kazimierz").lastName("Szymczak").build()
        );
    }


}
