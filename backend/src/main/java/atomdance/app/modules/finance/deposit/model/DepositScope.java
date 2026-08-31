package atomdance.app.modules.finance.deposit.model;

import atomdance.app.modules.group.model.GroupType;


/**
 * Which bank account a deposit belongs to.
 * This is what confines leftover credit: money taken for one bank account may only ever settle charges billed against the same one.
 */
public enum DepositScope {

	OPEN,

	TOURNAMENT;


	public static DepositScope of(GroupType groupType) {
		return switch (groupType) {
			case OPEN -> OPEN;
			case TOURNAMENT -> TOURNAMENT;
		};
	}
}
