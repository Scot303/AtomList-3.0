package atomdance.app.modules.finance.paymentList.model.financesheet;

import atomdance.app.modules.finance.deposit.model.PaymentMethod;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum PaymentMethodTranslate {
    TRANSFER(PaymentMethod.TRANSFER, "Przelew"),
    CASH(PaymentMethod.CASH, "Gotówka"),
    BLIK(PaymentMethod.BLIK, "BLIK");

    private final PaymentMethod paymentMethod;
    private final String plTranslation;

    public static String getTranslation(PaymentMethod paymentMethod) {
        for (var value : PaymentMethodTranslate.values()) {
            if (value.paymentMethod.equals(paymentMethod)) {
                return value.plTranslation;
            }
        }
        return null;
    }
}
