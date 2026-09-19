package atomdance.app.modules.finance.paymentList.model.financesheet;

import atomdance.app.modules.finance.transaction.model.TransactionType;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum TransactionTypeTranslate {
    INCOME(TransactionType.INCOME, "Przychód"),
    EXPENSE(TransactionType.EXPENSE, "Wydatek");

    private final TransactionType transactionType;
    private final String plTranslation;

    public static String getTranslation(TransactionType transactionType) {
        for (var value : TransactionTypeTranslate.values()) {
            if (value.transactionType.equals(transactionType)) {
                return value.plTranslation;
            }
        }
        return null;
    }
}
