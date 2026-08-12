import type { TagOption } from '@/components/ui/tags';
import type { ExtendedSelectOption } from '@/components/ui/extendedSelect';
import type { FieldType } from './columnMeta';
import type { operatorStrings } from '@/components/dataTable';

/* ── Operators ───────────────────────────────────────────────────────────── */

/**
 * Every operator the filter engine understands, derived from the one place that has to name them all anyway.
 * An operator exists exactly when it has labels, so the two can never drift apart.
 *
 * Deliberately not split per field type: {@link OPERATORS_BY_FIELD_TYPE} owns that mapping.
 */
export type FilterOperator = keyof typeof operatorStrings;

export type SortDirection = 'asc' | 'desc';

/** How two rules in an advanced filter are joined. */
export type RuleLogic = 'AND' | 'OR';


/* ── Tag shapes ──────────────────────────────────────────────────────────── */

/** One field, one operator, one value. Tag columns are the exception and allow several. */
export interface FilterTag {
	id: string;
	mode: 'simple';
	field: string;
	operator: FilterOperator;
	/** Tag columns hold every selected id; every other type reads `values[0]` only. */
	values: string[];
	/** Six hex digits, no leading `#`. */
	color: string;
}

/**
 * One rule inside an {@link AdvancedFilterTag}.
 *
 * `field` and `operator` are empty on a rule the user has only just added.
 */
export interface AdvancedFilterRule {
	id: string;
	field: string;
	operator: FilterOperator | '';
	values: string[];
	/** Joins this rule to the one before it. Undefined on the first rule, which has nothing to join to. */
	logicBefore?: RuleLogic;
}

/**
 * Several rules forming one WHERE clause. Only one of these may be active at a time.
 */
export interface AdvancedFilterTag {
	id: string;
	mode: 'advanced';
	rules: AdvancedFilterRule[];
	/**
	 * A boolean expression over 1-based rule indices, e.g. `"(1 AND 2) OR 3"`.
	 * When present and valid, it replaces every rule's `logicBefore` - the two are never combined.
	 */
	customExpression?: string;
	color: string;
}

export type FilterActiveTag = FilterTag | AdvancedFilterTag;


export interface SortTag {
	id: string;
	field: string;
	direction: SortDirection;
}


/* ── Column descriptor ───────────────────────────────────────────────────── */

/**
 * A column as the filter and sort UI sees it - flattened out of the TanStack column, so the popovers never need a table instance to render.
 *
 * Deliberately carries no `sortValue`: that function is typed against the row, which this descriptor is not.
 * {@link SortResolution} carries it instead, built where the row type is still known.
 */
export interface FilterableColumn {
	id: string;
	label: string;
	fieldType: FieldType;
	tagOptions?: TagOption[];
	selectOptions?: ExtendedSelectOption[];
}
