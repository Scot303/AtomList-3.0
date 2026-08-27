package atomdance.app.modules.sms.model;


import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;


@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name = "sms",
		indexes = {
				@Index(name = "idx_persons_id", columnList = "person_id"),
				@Index(name = "idx_familys_id", columnList = "family_id")
		})
public class Sms {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(length = 320)
	private String message;

	/**
	 * Who it was for, when the number reaches exactly one person.
	 * Null on a message sent to a shared family number, where {@link #family} holds the recipient instead.
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "person_id")
	private Person person;

	/**
	 * The household it was for, when the number is shared. Null whenever {@link #person} is set.
	 */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "family_id")
	private Family family;

	@Column(length = 9, nullable = false)
	private String sentToPhone;

	@Column(nullable = false)
	private Instant createdAt;


	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}


	public Sms(Person person, String message) {
		this.person = person;
		this.sentToPhone = person.getEffectivePhone();
		this.message = message;
	}


	public Sms(Family family, String message) {
		this.family = family;
		this.sentToPhone = family.getPhone();
		this.message = message;
	}


	/**
	 * One message for one number.
	 */
	public static Sms forRecipients(List<Person> recipients, String message) {
		Person first = recipients.getFirst();
		Family sharedFamily = first.getFamily();

		// Two people can share a number without sharing a household - a parent's mobile typed onto both children.
		// If there is no family to record that against, the first of them carries it.
		return recipients.size() == 1 || sharedFamily == null
				? new Sms(first, message)
				: new Sms(sharedFamily, message);
	}
}
