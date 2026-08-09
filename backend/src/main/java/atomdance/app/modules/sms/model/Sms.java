package atomdance.app.modules.sms.model;


import atomdance.app.modules.person.model.Family;
import atomdance.app.modules.person.model.Person;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
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

    @Column(length = 70)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person;

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
        this.setSentToPhone(family.getPhone());
        this.message = message;
    }

}
