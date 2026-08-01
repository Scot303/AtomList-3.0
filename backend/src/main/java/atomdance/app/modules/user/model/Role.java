package atomdance.app.modules.user.model;

import java.util.EnumSet;
import java.util.Set;

import static atomdance.app.modules.user.model.Permission.*;

/**
 * A named, curated bundle of permissions. Persisted by name (@Enumerated(EnumType.STRING) on User.roles)
 */
public enum Role {

	RECEPTIONIST(EnumSet.of(READ_PERSONS, READ_GROUPS, READ_PAYMENTS, READ_LISTS)),

	EMPLOYEE(combine(RECEPTIONIST, EnumSet.of(READ_INCOME_TRANSACTIONS, READ_EXPENSE_TRANSACTIONS, READ_INSTRUCTORS, READ_DISCOUNTS, VIEW_STATS))),

	MANAGER(combine(EMPLOYEE, EnumSet.of(MODIFY_DISCOUNTS, MODIFY_LISTS, MODIFY_PAYMENTS, MODIFY_GROUPS, MODIFY_INCOME_TRANSACTIONS, MODIFY_EXPENSE_TRANSACTIONS, MODIFY_INSTRUCTORS, MODIFY_PERSONS))),

	ADMIN(EnumSet.allOf(Permission.class));


	private final Set<Permission> permissions;

	Role(Set<Permission> permissions) {
		this.permissions = permissions;
	}

	public Set<Permission> getPermissions() {
		return permissions;
	}

	private static Set<Permission> combine(Role baseRole, Set<Permission> additional) {
		Set<Permission> combined = EnumSet.copyOf(baseRole.permissions);
		combined.addAll(additional);

		return combined;
	}
}
