package atomdance.app.modules.finance.model;

import atomdance.app.modules.user.model.Permission;

public enum TransactionType {

	INCOME(Permission.READ_INCOME_TRANSACTIONS, Permission.MODIFY_INCOME_TRANSACTIONS),

	EXPENSE(Permission.READ_EXPENSE_TRANSACTIONS, Permission.MODIFY_EXPENSE_TRANSACTIONS);

	private final Permission readPermission;
	private final Permission modifyPermission;

	TransactionType(Permission readPermission, Permission modifyPermission) {
		this.readPermission = readPermission;
		this.modifyPermission = modifyPermission;
	}

	public Permission readPermission() {
		return readPermission;
	}

	public Permission modifyPermission() {
		return modifyPermission;
	}
}
