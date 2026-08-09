import type { FieldType } from '../types/columnMeta';
import type { FilterOperator } from '../types/filterTypes';
import { operatorStrings } from './dataTableStrings';

/**
 * Operators that take no value, so the value input is hidden and `values` is forced empty.
 * Typed as a set of strings rather than of operators, so a rule's empty `''` operator can be tested against it without a cast.
 */
export const VALUELESS_OPERATORS: ReadonlySet<string> = new Set<FilterOperator>([
	'is_empty',
	'is_not_empty',
]);

export interface OperatorOption {
	id: FilterOperator;
	name: string;
}

const option = (id: FilterOperator): OperatorOption => ({ id, name: operatorStrings[id].select });

const PRESENCE: OperatorOption[] = [option('is_empty'), option('is_not_empty')];

/**
 * Which operators each field type offers.
 */
export const OPERATORS_BY_FIELD_TYPE: Record<FieldType, OperatorOption[]> = {
	text: [
		option('equals'),
		option('not_equals'),
		option('contains'),
		option('not_contains'),
		option('starts_with'),
		option('ends_with'),
		...PRESENCE,
	],
	number: [
		option('eq'),
		option('neq'),
		option('gt'),
		option('lt'),
		option('gte'),
		option('lte'),
		...PRESENCE,
	],
	date: [
		option('date_is'),
		option('date_before'),
		option('date_after'),
		...PRESENCE,
	],
	select: [
		option('equals'),
		option('not_equals'),
		...PRESENCE,
	],
	tag: [
		option('tag_is_any_of'),
		option('tag_is_none_of'),
		...PRESENCE,
	],
	// No presence operators: a boolean column is never empty.
	boolean: [
		option('equals'),
		option('not_equals'),
	],
};

export function getOperatorsForFieldType(fieldType: FieldType): OperatorOption[] {
	return OPERATORS_BY_FIELD_TYPE[fieldType];
}

export function getOperatorBadgeLabel(operator: FilterOperator): string {
	return operatorStrings[operator].badge;
}
