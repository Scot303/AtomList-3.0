package atomdance.app.modules.sms.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;
import java.util.UUID;


/**
 * One message, to everybody named directly and everybody currently attending the groups named.
 * <p>
 * The two lists are a union, not a choice: picking a group and then one more person out of another group is a single send. Whoever ends up on both is texted once.
 */
public record SendSmsRequest(

		@NotBlank(message = "Message is required")
		@Size(max = 320, message = "Message is too long")
		String message,

		Set<UUID> personIds,

		Set<UUID> groupIds
) {

	public SendSmsRequest {
		personIds = personIds == null ? Set.of() : personIds;
		groupIds = groupIds == null ? Set.of() : groupIds;
	}


	@AssertTrue(message = "At least one person or group is required")
	public boolean isAddressed() {
		return !personIds.isEmpty() || !groupIds.isEmpty();
	}
}
