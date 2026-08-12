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
 * Narrows data to the rows that answer to every whitespace-separated term in `query`.
 *
 * Terms are matched independently of one another, so a query may span several columns: "kowalski jan"
 * and "jan kowalski" both find the row whose first name reads Jan and whose surname reads Kowalski,
 * neither of which holds the query as a whole. A single term still has to sit inside one value, which
 * is what keeps the terms from blurring together into "any of these letters, anywhere".
 */
export function applyGlobalSearch<T extends object>(data: T[], query: string, fields: SearchField<T>[]): T[] {
	const terms = query.toLowerCase().split(/\s+/).filter((term) => term !== '');

	if (terms.length === 0 || fields.length === 0) {
		return data;
	}

	return data.filter((row) => rowMatches(row, terms, fields));
}


/**
 * Whether the row's searched columns cover every term between them.
 */
function rowMatches<T>(row: T, terms: string[], fields: SearchField<T>[]): boolean {
	const cells = fields.map((field) => ({ field, values: cellValues(field, row) }));
	const stored = cells.flatMap(({ field, values }) => values.map((value) => storedText(field, value)));

	const left = terms.filter((term) => !stored.some((text) => text.includes(term)));

	if (left.length === 0) {
		return true;
	}

	const rendered = cells.flatMap(({ field, values }) => {
		const format = field.format;

		return format === undefined ? [] : values.map((value) => nodeText(format(value)).toLowerCase());
	});

	return left.every((term) => rendered.some((text) => text.includes(term)));
}


/**
 * The values one cell offers for matching.
 *
 * A multi-value cell is matched member by member, so no single term can straddle two of them: "vippar"
 * is not a hit on a row tagged VIP and Partner, though "vip par" is.
 */
function cellValues<T>(field: SearchField<T>, row: T): unknown[] {
	const raw = field.read(row);

	return Array.isArray(raw) ? raw : [raw];
}


/**
 * How one of a cell's values reads as stored, lowercased for matching.
 *
 * The rendered text is searched on top of this rather than instead of it, so a column gaining a
 * formatter can only ever make rows easier to find: a date reads as "2 lutego 2024" and is still
 * found by the "2024-02-02" it is stored as.
 */
function storedText<T>(field: SearchField<T>, value: unknown): string {
	if (value == null) {
		return '';
	}

	const text = String(value);

	return (field.names?.get(text) ?? text).toLowerCase();
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
