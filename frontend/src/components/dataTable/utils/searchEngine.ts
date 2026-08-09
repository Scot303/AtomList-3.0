/**
 * One column's contribution to the toolbar's search box.
 * Built in `useDataTable`, where the row type is still known.
 */
export interface SearchField<T> {
	/** Produces the value this column offers for matching. */
	read: (row: T) => unknown;
	/** Option id → display name, so a tag or select column matches on its label rather than on the stored id. */
	names?: Map<string, string>;
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

	if (raw == null) {
		return false;
	}

	const values = Array.isArray(raw) ? raw : [raw];

	return values.some((value) => {
		const text = String(value ?? '');

		return (field.names?.get(text) ?? text).toLowerCase().includes(needle);
	});
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
