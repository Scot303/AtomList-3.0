package atomdance.app.modules.finance.paymentList.model.financesheet;

import atomdance.app.modules.finance.payment.model.PaymentChargeKind;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum PaymentChargeKindTranslate {
    MEMBERSHIP_MONTHLY(PaymentChargeKind.MEMBERSHIP_MONTHLY, "Opłata miesięczna"),
    MEMBERSHIP_PER_CLASS(PaymentChargeKind.MEMBERSHIP_PER_CLASS, "Opłata od liczby wejść na zajęcia"),
    ONE_TIME(PaymentChargeKind.ONE_TIME, "Jednorazowo");

    private final PaymentChargeKind paymentChargeKind;
    private final String plTranslation;

    public static String getTranslation(PaymentChargeKind paymentChargeKind) {
        for (var value : PaymentChargeKindTranslate.values()) {
            if (value.paymentChargeKind.equals(paymentChargeKind)) {
                return value.plTranslation;
            }
        }
        return null;
    }
}
