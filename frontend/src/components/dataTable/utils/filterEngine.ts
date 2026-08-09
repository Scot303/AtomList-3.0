import type { AdvancedFilterRule, AdvancedFilterTag, FilterActiveTag, FilterOperator } from '../types/filterTypes';
import { VALUELESS_OPERATORS } from '../config/filterOperators';
import { evaluateExpressionNode, parseExpression } from './expressionParser';


type RowPredicate<T> = (row: T) => boolean;

/** A rule as far as matching is concerned - a simple tag and an advanced rule are the same shape. */
type MatchableRule = Pick<AdvancedFilterRule, 'field' | 'operator' | 'values'>;

/**
 * Narrows `data` to the rows every tag accepts.
 * Tags are always ANDed with each other; the OR-ing lives inside an advanced tag's rules.
 */
export function applyFilterTags<T extends object>(data: T[], tags: FilterActiveTag[]): T[] {
	if (tags.length === 0) {
		return data;
	}

	const predicates = tags.map((tag) => compileTag<T>(tag));

	return data.filter((row) => predicates.every((matches) => matches(row)));
}

function compileTag<T extends object>(tag: FilterActiveTag): RowPredicate<T> {
	return tag.mode === 'advanced' ? compileAdvancedTag<T>(tag) : compileRule<T>(tag);
}


/* ── Advanced tag ────────────────────────────────────────────────────────── */

function compileAdvancedTag<T extends object>(tag: AdvancedFilterTag): RowPredicate<T> {
	if (tag.rules.length === 0) {
		return () => true;
	}

	const rulePredicates = tag.rules.map((rule) => compileRule<T>(rule));

	const expression = tag.customExpression?.trim();
	if (expression !== undefined && expression !== '') {
		const parsed = parseExpression(expression, tag.rules.length);

		if (parsed.ok) {
			return (row) => evaluateExpressionNode(parsed.node, rulePredicates.map((matches) => matches(row)));
		}
	}

	// AND binds tighter than OR: split into OR-separated groups of ANDed rules, once.
	const orGroups: number[][] = [[]];
	tag.rules.forEach((rule, index) => {
		if (index > 0 && (rule.logicBefore ?? 'AND') === 'OR') {
			orGroups.push([]);
		}
		orGroups[orGroups.length - 1].push(index);
	});

	return (row) => orGroups.some((group) => group.every((index) => rulePredicates[index](row)));
}


/* ── Single rule ─────────────────────────────────────────────────────────── */

function compileRule<T extends object>(rule: MatchableRule): RowPredicate<T> {
	const { field, operator, values } = rule;
	const read = (row: T) => (row as Record<string, unknown>)[field];

	if (VALUELESS_OPERATORS.has(operator)) {
		const wantEmpty = operator === 'is_empty';

		return (row) => isEmptyValue(read(row)) === wantEmpty;
	}

	if (operator === 'tag_is_any_of' || operator === 'tag_is_none_of') {
		const wanted = new Set(values);
		const shouldMatch = operator === 'tag_is_any_of';

		return (row) => {
			const raw = read(row);
			const ids = Array.isArray(raw) ? raw.map(String) : [String(raw ?? '')];
			const hit = ids.some((id) => wanted.has(id));

			return hit === shouldMatch;
		};
	}

	const value = values[0];
	if (value === undefined || value === '') {
		// A half-built rule filters nothing out rather than emptying the table while it is typed.
		return () => true;
	}

	return compileValueMatcher<T>(operator, value, read);
}


function compileValueMatcher<T>(operator: FilterOperator | '', value: string, read: (row: T) => unknown): RowPredicate<T> {
	switch (operator) {
		case 'eq':
		case 'neq':
		case 'gt':
		case 'lt':
		case 'gte':
		case 'lte': {
			const target = Number(value);

			if (Number.isNaN(target)) {
				return () => true;
			}

			return (row) => {
				const num = toNumber(read(row));

				if (num === null) {
					return false;
				}

				switch (operator) {
					case 'eq':
						return num === target;
					case 'neq':
						return num !== target;
					case 'gt':
						return num > target;
					case 'lt':
						return num < target;
					case 'gte':
						return num >= target;
					default:
						return num <= target;
				}
			};
		}

		case 'date_is':
		case 'date_before':
		case 'date_after': {
			const target = toDayStart(value);

			if (target === null) {
				return () => true;
			}

			return (row) => {
				const day = toDayStart(read(row));

				if (day === null) {
					return false;
				}

				switch (operator) {
					case 'date_is':
						return day === target;
					case 'date_before':
						return day < target;
					default:
						return day > target;
				}
			};
		}

		case 'equals':
		case 'not_equals': {
			const wantEqual = operator === 'equals';
			const needle = value.toLowerCase();

			// A boolean column compares as a boolean, so "false" does not read as a non-empty string.
			const asBoolean = needle === 'true' || needle === 'false' ? needle === 'true' : null;

			return (row) => {
				const raw = read(row);
				const equal = typeof raw === 'boolean' && asBoolean !== null
					? raw === asBoolean
					: normalise(raw) === needle;

				return equal === wantEqual;
			};
		}

		case 'contains':
		case 'not_contains': {
			const needle = value.toLowerCase();
			const wantHit = operator === 'contains';

			return (row) => normalise(read(row)).includes(needle) === wantHit;
		}

		case 'starts_with': {
			const needle = value.toLowerCase();

			return (row) => normalise(read(row)).startsWith(needle);
		}

		case 'ends_with': {
			const needle = value.toLowerCase();

			return (row) => normalise(read(row)).endsWith(needle);
		}

		default:
			return () => true;
	}
}


/* ── Value helpers ───────────────────────────────────────────────────────── */

function isEmptyValue(raw: unknown): boolean {
	if (raw == null) {
		return true;
	}

	if (Array.isArray(raw)) {
		return raw.length === 0;
	}

	return String(raw).trim() === '';
}

function normalise(raw: unknown): string {
	return String(raw ?? '').toLowerCase();
}

function toNumber(raw: unknown): number | null {
	if (typeof raw === 'number') {
		return Number.isNaN(raw) ? null : raw;
	}

	if (typeof raw === 'string' && raw.trim() !== '') {
		const parsed = Number(raw);

		return Number.isNaN(parsed) ? null : parsed;
	}

	return null;
}

/**
 * Midnight of the value's calendar day, so date comparisons ignore any time component rather than
 * making "is 2026-08-08" false for a timestamp later that morning.
 */
function toDayStart(raw: unknown): number | null {
	if (raw == null || raw === '') {
		return null;
	}

	const date = raw instanceof Date ? raw : new Date(String(raw));

	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
