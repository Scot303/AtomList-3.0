package atomdance.app.common.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;

public final class Money {

	public static final int SCALE = 2;

	public static final RoundingMode ROUNDING = RoundingMode.HALF_UP;

	public static final BigDecimal ZERO = normalize(BigDecimal.ZERO);

	private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

	private static final DecimalFormat FORMATTER;

	static {
		DecimalFormatSymbols symbols = new DecimalFormatSymbols();
		symbols.setDecimalSeparator(',');
		FORMATTER = new DecimalFormat("0.00", symbols);
	}

	private Money() {
	}


	public static BigDecimal normalize(BigDecimal amount) {
		return amount == null ? BigDecimal.ZERO.setScale(SCALE, ROUNDING) : amount.setScale(SCALE, ROUNDING);
	}

	public static BigDecimal add(BigDecimal left, BigDecimal right) {
		return normalize(orZero(left).add(orZero(right)));
	}

	public static BigDecimal subtract(BigDecimal left, BigDecimal right) {
		return normalize(orZero(left).subtract(orZero(right)));
	}

	public static BigDecimal multiply(BigDecimal amount, BigDecimal quantity) {
		return normalize(orZero(amount).multiply(orZero(quantity)));
	}

	/**
	 * {@code percent} is a whole-number percentage - 10 means 10%, not 0.1.
	 */
	public static BigDecimal percentOf(BigDecimal amount, BigDecimal percent) {
		if (isZero(percent)) {
			return ZERO;
		}

		return normalize(orZero(amount).multiply(orZero(percent)).divide(HUNDRED, SCALE, ROUNDING));
	}

	public static String format(BigDecimal amount) {
		return FORMATTER.format(amount);
	}

	public static boolean isZero(BigDecimal amount) {
		return amount == null || amount.signum() == 0;
	}

	public static boolean isNegative(BigDecimal amount) {
		return amount != null && amount.signum() < 0;
	}

	public static boolean isPositive(BigDecimal amount) {
		return amount != null && amount.signum() > 0;
	}

	public static boolean isGreaterThan(BigDecimal left, BigDecimal right) {
		return orZero(left).compareTo(orZero(right)) > 0;
	}

	public static BigDecimal min(BigDecimal left, BigDecimal right) {
		return orZero(left).compareTo(orZero(right)) <= 0 ? normalize(left) : normalize(right);
	}

	/**
	 * Clamps a negative result to zero. Used for "outstanding" and "remaining" figures, where a
	 * negative number would mean an overpayment and should be read as nothing left owing.
	 */
	public static BigDecimal atLeastZero(BigDecimal amount) {
		return isNegative(amount) ? ZERO : normalize(amount);
	}

	private static BigDecimal orZero(BigDecimal amount) {
		return amount == null ? BigDecimal.ZERO : amount;
	}
}
