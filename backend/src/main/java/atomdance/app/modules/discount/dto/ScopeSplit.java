package atomdance.app.modules.discount.dto;

import atomdance.app.modules.group.model.GroupType;


/**
 * The same figures split by where they are billed, since the two sheets are paid into different accounts.
 */
public record ScopeSplit(MoneyScope open, MoneyScope tournament, MoneyScope total) {

	public static ScopeSplit zero() {
		return new ScopeSplit(MoneyScope.zero(), MoneyScope.zero(), MoneyScope.zero());
	}


	public ScopeSplit plus(GroupType type, MoneyScope scope) {
		return new ScopeSplit(
				type == GroupType.TOURNAMENT ? open : open.plus(scope),
				type == GroupType.TOURNAMENT ? tournament.plus(scope) : tournament,
				total.plus(scope)
		);
	}


	public ScopeSplit plus(ScopeSplit other) {
		return new ScopeSplit(open.plus(other.open), tournament.plus(other.tournament), total.plus(other.total));
	}
}
