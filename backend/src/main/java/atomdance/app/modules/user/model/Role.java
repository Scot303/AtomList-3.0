package atomdance.app.modules.user.model;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

import static atomdance.app.modules.user.model.Permission.*;


/**
 * A named, curated bundle of permissions. Persisted by name (@Enumerated(EnumType.STRING) on User.roles)
 */
public enum Role {

	BASIC(EnumSet.of(READ_PERSONS, READ_FAMILIES, READ_GROUPS, PRINT_ATTENDANCE)),

	RECEPTIONIST(combine(BASIC, EnumSet.of(MODIFY_PERSONS, MODIFY_FAMILIES, MODIFY_GROUPS))),

	EMPLOYEE(combine(RECEPTIONIST, EnumSet.of(READ_PAYMENTS, READ_LISTS, READ_INCOME_TRANSACTIONS, READ_EXPENSE_TRANSACTIONS, READ_INSTRUCTORS, READ_DISCOUNTS, READ_SMS))),

	MANAGER(combine(EMPLOYEE, EnumSet.of(MODIFY_DISCOUNTS, MODIFY_LISTS, CLOSE_LISTS, MODIFY_PAYMENTS, MODIFY_INCOME_TRANSACTIONS, MODIFY_EXPENSE_TRANSACTIONS, MODIFY_INSTRUCTORS, SEND_SMS, VIEW_STATS))),

	ADMIN(EnumSet.allOf(Permission.class));


	private final Set<Permission> permissions;


	Role(Set<Permission> permissions) {
		this.permissions = Collections.unmodifiableSet(permissions);
	}


	public Set<Permission> getPermissions() {
		return permissions;
	}


	private static Set<Permission> combine(Role baseRole, Set<Permission> additional) {
		Set<Permission> combined = EnumSet.noneOf(Permission.class);
		combined.addAll(baseRole.permissions);
		combined.addAll(additional);

		return combined;
	}
}
