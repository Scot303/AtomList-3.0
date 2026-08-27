package atomdance.app.modules.sms.dto;

import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.sms.model.Sms;
import atomdance.app.modules.sms.model.SmsSegments;

import java.time.Instant;
import java.util.UUID;


public record SmsView(
		UUID id,
		String message,
		/** Set when the number reached exactly one person. Null on a message to a shared family number. */
		UUID personId,
		/** Set when the number is shared by a household. Null on a message to one person. */
		UUID familyId,
		/** Who it went to, in words - a person's full name, or the household's name. */
		String recipientName,
		String sentToPhone,
		/** How many chargeable parts it was sent as. */
		int segments,
		Instant createdAt
) {

	public static SmsView from(Sms sms) {
		Person person = sms.getPerson();
		Family family = sms.getFamily();

		return new SmsView(
				sms.getId(),
				sms.getMessage(),
				person == null ? null : person.getId(),
				family == null ? null : family.getId(),
				recipientName(person, family),
				sms.getSentToPhone(),
				SmsSegments.count(sms.getMessage()),
				sms.getCreatedAt()
		);
	}


	private static String recipientName(Person person, Family family) {
		if (person != null) {
			return person.getFullName();
		}

		return family == null ? null : family.getName();
	}
}
