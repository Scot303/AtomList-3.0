import { isValidElement, type ReactNode } from 'react';


/**
 * One column's contribution to the toolbar's search box.
 * Built in `useDataTable`, where the row type is still known.
 */
export interface SearchField<T> {
	/** Produces the value this column offers for matching. */
	read: (row: T) => unknown;
	/** Option id → display name, so a tag or select column matches on its label rather than on the stored id. */
	names?: Map<string, string>;
	/**
	 * Renders a value the way the cell shows it, so a reformatted date or amount is searchable as it reads.
	 * Called once per value, so a multi-value cell formats each of its members on its own.
	 */
	format?: (value: unknown) => ReactNode;
}


/**
 * Narrows data to the rows where at least one searched column contains `query`.
 *
 * Runs over the raw rows rather than through TanStack's `globalFilteringFeature`, for two reasons:
 * the filtered row model is memoised on the filter state alone, so a column hidden mid-search would
 * keep pulling its rows in until the query changed; and matching a tag or select column on its
 * label rather than on its stored id needs the option tables, which only exist on this side.
 */
export function applyGlobalSearch<T extends object>(data: T[], query: string, fields: SearchField<T>[]): T[] {
	const needle = query.trim().toLowerCase();

	if (needle === '' || fields.length === 0) {
		return data;
	}

	return data.filter((row) => fields.some((field) => fieldMatches(field, row, needle)));
}


/**
 * Whether any one of the column's values contains `needle`.
 *
 * A multi-value cell is matched member by member, so a query cannot straddle two of them -
 * "vip par" is not a hit on a row tagged VIP and Partner.
 */
function fieldMatches<T>(field: SearchField<T>, row: T, needle: string): boolean {
	const raw = field.read(row);
	const values = Array.isArray(raw) ? raw : [raw];

	return values.some((value) => valueMatches(field, value, needle));
}


/**
 * Whether one of a cell's values contains `needle`, as it is stored or as it reads on screen.
 *
 * The formatted text is searched on top of the stored value rather than instead of it, so a column
 * gaining a formatter can only ever make rows easier to find: a date reads as "2 lutego 2024" and is
 * still found by the "2024-02-02" it is stored as.
 */
function valueMatches<T>(field: SearchField<T>, value: unknown, needle: string): boolean {
	if (value != null) {
		const text = String(value);

		if ((field.names?.get(text) ?? text).toLowerCase().includes(needle)) {
			return true;
		}
	}

	return field.format !== undefined && nodeText(field.format(value)).toLowerCase().includes(needle);
}


/**
 * The text a rendered cell reads as.
 */
function nodeText(node: ReactNode): string {
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node);
	}

	if (Array.isArray(node)) {
		return node.map(nodeText).join(' ');
	}

	if (isValidElement(node)) {
		return nodeText((node.props as { children?: ReactNode }).children);
	}

	return '';
}


/**
 * Whether a column looks like it holds text worth scanning, for columns that have not said either way through `meta.globalSearch`.
 */
export function holdsSearchableText<T>(data: T[], read: (row: T) => unknown): boolean {
	for (const row of data) {
		const value = read(row);

		if (value != null) {
			return typeof value === 'string' || typeof value === 'number';
		}
	}

	return false;
}
