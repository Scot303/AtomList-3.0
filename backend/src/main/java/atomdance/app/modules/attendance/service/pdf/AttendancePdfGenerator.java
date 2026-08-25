package atomdance.app.modules.attendance.service.pdf;

import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.attendance.model.GenResultPayload;
import atomdance.app.modules.group.model.Group;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.model.Person;
import lombok.RequiredArgsConstructor;
import org.openpdf.pdf.ITextRenderer;
import org.openpdf.text.pdf.BaseFont;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AttendancePdfGenerator {
    private static final ClassLoaderTemplateResolver resolver;
    private static final String TEMPLATE_CLASSPATH = "templates/attendance/";
    private static final int[] DEFAULT_COLUMN_DEPTH = new int[10];
    private static final String FILENAME_TEMPLATE = "%s_%s";
    private final AppClock appClock;
    private final MembershipRepository membershipRepository;

    static {
        resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix(TEMPLATE_CLASSPATH);
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
    }

    public GenResultPayload generateAttendancePdf(Group group) throws IOException {
        TemplateEngine templateEngine = new TemplateEngine();
        templateEngine.setTemplateResolver(resolver);

        var currentYearMonth = appClock.currentYearMonth();

        var context = getTemplateContext(group, currentYearMonth);
        String fileName = FILENAME_TEMPLATE.formatted(group.getName().replace(" ", "_"), currentYearMonth.toString());

        String processedHtmlTemplate = templateEngine.process("attendance_template", context);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var renderer = getTemplateRenderer();

            renderer.setDocumentFromString(processedHtmlTemplate);
            renderer.layout();
            renderer.createPDF(outputStream);

            return new GenResultPayload(fileName, outputStream.toByteArray());
        }
    }

    private Context getTemplateContext(Group group, YearMonth currentYearMonth) {
        Context context = new Context();

        var localizedFormatter = DateTimeFormatter.ofPattern("LLLL yyyy", Locale.forLanguageTag("pl"));
        var genDateLocalized = currentYearMonth.format(localizedFormatter);
        genDateLocalized = genDateLocalized.substring(0,1).toUpperCase() + genDateLocalized.substring(1);

        List<String> membersNames = getGroupMembersNames(group.getId());
        context.setVariable("names", membersNames);
        context.setVariable("groupName", group.getName());
        context.setVariable("genDate", genDateLocalized);
        context.setVariable("sessions", DEFAULT_COLUMN_DEPTH);
        return context;
    }

    private ITextRenderer getTemplateRenderer() throws IOException {
        ITextRenderer renderer = new ITextRenderer();

        URL fontUrl = getClass().getClassLoader().getResource(TEMPLATE_CLASSPATH + "arial_unicode_ms.otf");
        renderer.getFontResolver().addFont(fontUrl.toExternalForm(), BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

        return renderer;
    }

    private List<String> getGroupMembersNames(UUID groupId) {
    return membershipRepository.findActivePersonsInGroup(groupId).stream()
            .map(Person::getFullName)
            .toList();
    }
}