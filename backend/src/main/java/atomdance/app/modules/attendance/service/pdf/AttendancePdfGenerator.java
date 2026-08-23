package atomdance.app.modules.attendance.service.pdf;

import atomdance.app.common.utils.AppClock;
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
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AttendancePdfGenerator {
    private static final ClassLoaderTemplateResolver resolver;
    private static final String TEMPLATE_CLASSPATH = "templates/attendance/";
    private final AppClock appClock;
    private final MembershipRepository membershipRepository;

    static {
        resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix(TEMPLATE_CLASSPATH);
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
    }

    public byte[] generateAttendancePdf(Group group) throws IOException {
        TemplateEngine templateEngine = new TemplateEngine();
        templateEngine.setTemplateResolver(resolver);

        var context = getTemplateContext(group);

        String processedHtmlTemplate = templateEngine.process("attendance_template", context);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var renderer = getTemplateRenderer();

            renderer.setDocumentFromString(processedHtmlTemplate);
            renderer.layout();
            renderer.createPDF(outputStream);

            return outputStream.toByteArray();
        }
    }

    private Context getTemplateContext(Group group) {
        Context context = new Context();

        List<String> membersNames = getGroupMembersNames(group.getId());
        context.setVariable("names", membersNames);
        context.setVariable("groupName", group.getName());
        context.setVariable("genDate", appClock.today());
        context.setVariable("sessions", new int[10]);
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
