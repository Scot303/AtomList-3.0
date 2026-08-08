package atomdance.app.modules.sms.model;


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
@Table(name = "sms")
public class Sms {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 70)
    private String message;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id")
    private Person person;

    //TODO Keep phone number where msg was sent?
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

}
