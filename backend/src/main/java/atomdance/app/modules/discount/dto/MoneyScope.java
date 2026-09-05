package atomdance.app.modules.discount.dto;

import atomdance.app.common.utils.Money;

import java.math.BigDecimal;


/**
 * One pile of money as a discount leaves it.
 *
 * @param gross    the charge before any discount
 * @param discount what the discount took off
 * @param net      what is actually owed
 */
public record MoneyScope(BigDecimal gross, BigDecimal discount, BigDecimal net) {

	public static MoneyScope zero() {
		return new MoneyScope(Money.ZERO, Money.ZERO, Money.ZERO);
	}


	public MoneyScope plus(MoneyScope other) {
		return new MoneyScope(
				Money.add(gross, other.gross),
				Money.add(discount, other.discount),
				Money.add(net, other.net)
		);
	}
}
