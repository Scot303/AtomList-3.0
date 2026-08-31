package atomdance.app.modules.sms.service;


import atomdance.app.common.exception.InvalidOperationException;
import atomdance.app.common.exception.NotFoundException;
import atomdance.app.common.sms.SmsApiClient;
import atomdance.app.common.utils.AppClock;
import atomdance.app.modules.audit.model.AuditEventType;
import atomdance.app.modules.audit.service.AuditLogger;
import atomdance.app.modules.group.repository.MembershipRepository;
import atomdance.app.modules.person.model.Person;
import atomdance.app.modules.person.repository.PersonRepository;
import atomdance.app.modules.sms.dto.SendSmsRequest;
import atomdance.app.modules.sms.dto.SkippedRecipientView;
import atomdance.app.modules.sms.dto.SkippedRecipientView.SkipReason;
import atomdance.app.modules.sms.dto.SmsSendResultView;
import atomdance.app.modules.sms.dto.SmsView;
import atomdance.app.modules.sms.exception.SmsSendException;
import atomdance.app.modules.sms.model.Sms;
import atomdance.app.modules.sms.model.SmsSegments;
import atomdance.app.modules.sms.repository.SmsRepository;
import atomdance.json.justsend.BulkSendRequest;
import atomdance.json.justsend.RestRecipient;
import atomdance.json.justsend.SingleSendRequest;
import io.micrometer.common.util.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;

import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static atomdance.app.common.utils.StaticValuesUtil.ATOM_DANCE_SENDER;
import static atomdance.app.common.utils.StaticValuesUtil.PHONE_COUNTRY_CODE;


@Service
@RequiredArgsConstructor
@Slf4j
public class SmsService {

	private static final Comparator<Person> BY_NAME = Comparator
			.comparing(Person::getLastName, String.CASE_INSENSITIVE_ORDER)
			.thenComparing(Person::getName, String.CASE_INSENSITIVE_ORDER);

	/**
	 * Names the batch at the operator end. Two sends a minute apart have to be told apart there.
	 */
	private static final DateTimeFormatter BATCH_STAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmm");

	private final SmsRepository smsRepository;
	private final AuditLogger auditLogger;
	private final SmsApiClient smsApiClient;
	private final PersonRepository personRepository;
	private final MembershipRepository membershipRepository;
	private final AppClock appClock;
	private final List<String> phoneWhitelist;


	@Transactional
	public void saveSentScheduledBulkSms(List<Sms> sentSms) {
		smsRepository.saveAllAndFlush(sentSms);

		String logMsg = "Created %d automated SMS records.".formatted(sentSms.size());
		auditLogger.systemSuccess(AuditEventType.SMS_CREATION, null, logMsg);
		log.info(logMsg);
	}


	@Transactional(readOnly = true)
	public List<SmsView> getAll() {
		List<Sms> smsList = smsRepository.findAllWithRecipients();

		auditLogger.read(AuditEventType.SMS_PREVIEW, null, "Previewed all sms messages.");

		return smsList.stream().map(SmsView::from).toList();
	}


	/**
	 * Sends one message to everybody named and everybody attending the groups named.
	 * <p>
	 * A household sharing one number is texted once, and anybody picked twice - named directly and again through a group - counts once.
	 * Nothing is written until the operator has accepted the batch, so a failed SMS delivery leaves no history behind.
	 */
	@Transactional
	public SmsSendResultView send(SendSmsRequest request) {
		List<Person> recipients = resolveRecipients(request);

		List<SkippedRecipientView> skipped = new ArrayList<>();
		Map<String, List<Person>> byPhone = groupReachableByPhone(recipients, skipped);

		if (byPhone.isEmpty()) {
			throw new InvalidOperationException("error.sms_nobody_reachable");
		}

		List<Sms> messages = byPhone.values().stream()
				.map(sharingPhone -> Sms.forRecipients(sharingPhone, request.message()))
				.toList();

		dispatch(messages, request.message());

		smsRepository.saveAllAndFlush(messages);


		int segments = SmsSegments.count(request.message()) * messages.size();

		String skippedRecipients = skipped.stream()
				.map(recipient -> "%s - %s".formatted(recipient.fullName(), recipient.reason()))
				.toList()
				.toString();

		String logMsg = "Sent sms to %d recipient(s), content length - %d, generated %d actual sms messages, skipped recipients: %s"
				.formatted(messages.size(), request.message().length(), segments, skippedRecipients);

		auditLogger.success(AuditEventType.SMS_CREATION, null, logMsg);

		return new SmsSendResultView(messages.stream().map(SmsView::from).toList(), skipped);
	}


	/* ------------------ RECIPIENTS ------------------ */


	/**
	 * The union of the people named and the people currently attending the groups named, each of them once.
	 */
	private List<Person> resolveRecipients(SendSmsRequest request) {
		Set<UUID> ids = new LinkedHashSet<>(request.personIds());

		if (!request.groupIds().isEmpty()) {
			ids.addAll(membershipRepository.findActivePersonIdsInGroups(request.groupIds()));
		}

		if (ids.isEmpty()) {
			throw new InvalidOperationException("error.sms_no_recipients");
		}

		List<Person> found = personRepository.findAllByIdWithFamily(ids);

		if (found.size() < request.personIds().size()) {
			throw new NotFoundException("entity.person");
		}

		return found.stream().sorted(BY_NAME).toList();
	}


	/**
	 * Everybody who can actually be texted, gathered under the number they are reachable on.
	 * Whoever cannot be is added to {@code skipped} rather than failing the SMS delivery.
	 */
	private Map<String, List<Person>> groupReachableByPhone(List<Person> recipients, List<SkippedRecipientView> skipped) {
		Map<String, List<Person>> byPhone = new LinkedHashMap<>();

		for (Person person : recipients) {
			String phone = person.getEffectivePhone();

			if (StringUtils.isBlank(phone)) {
				skipped.add(skip(person, SkipReason.NO_PHONE));
				continue;
			}

			if (!isWhitelisted(phone)) {
				skipped.add(skip(person, SkipReason.NOT_WHITELISTED));
				continue;
			}

			byPhone.computeIfAbsent(phone, key -> new ArrayList<>()).add(person);
		}

		return byPhone;
	}


	/**
	 * Whether sends are allowed to reach this number. An empty whitelist lets everything through.
	 */
	private boolean isWhitelisted(String phone) {
		return phoneWhitelist.isEmpty() || phoneWhitelist.contains(phone);
	}


	private static SkippedRecipientView skip(Person person, SkipReason reason) {
		return new SkippedRecipientView(person.getId(), person.getFullName(), reason);
	}


	/* ------------------ DISPATCH ------------------ */


	/**
	 * Hands the batch to the operator.
	 */
	private void dispatch(List<Sms> messages, String content) {
		try {
			if (messages.size() == 1) {
				sendSingleSms(messages.getFirst());
			} else {
				sendBulkSms(messages, content);
			}
		} catch (HttpStatusCodeException e) {
			String errorMsg = "JustSend API returned %s: %s".formatted(e.getStatusCode(), e.getMessage());
			auditLogger.failure(AuditEventType.SMS_SEND, null, errorMsg);

			throw new SmsSendException("entity.sms");
		}
	}


	private void sendSingleSms(Sms sms) {
		SingleSendRequest ssr = new SingleSendRequest()
				.withBulkVariant(SingleSendRequest.BulkVariant.PRO)
				.withSender(ATOM_DANCE_SENDER)
				.withMsisdn(PHONE_COUNTRY_CODE + sms.getSentToPhone())
				.withContent(sms.getMessage());

		smsApiClient.singleSendMessage(ssr);
	}


	private void sendBulkSms(List<Sms> messages, String content) {
		List<RestRecipient> recipients = messages.stream()
				.map(sms -> new RestRecipient().withMsisdn(PHONE_COUNTRY_CODE + sms.getSentToPhone()))
				.toList();

		BulkSendRequest bulkSendRequest = new BulkSendRequest()
				.withName("AtomDance:" + appClock.nowOffset().format(BATCH_STAMP))
				.withBulkType(BulkSendRequest.BulkType.STANDARD)
				.withBulkVariant(BulkSendRequest.BulkVariant.PRO)
				.withSender(ATOM_DANCE_SENDER)
				.withMessage(content)
				.withSendDate(appClock.nowOffset().plusMinutes(1L).truncatedTo(ChronoUnit.MINUTES))
				.withRecipients(recipients);

		smsApiClient.bulkSendMessage(bulkSendRequest);
	}
}
