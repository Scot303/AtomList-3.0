/**
 * Every piece of text the data table renders, in one place.
 */
export const dataTableStrings = {
	table: {
		searchPlaceholder: 'Szukaj…',
		noData: 'Brak danych',
		filters: 'Filtry',
		columns: 'Kolumny',
		resetLayout: 'Przywróć domyślny układ',
		group: 'Grupuj',
		groupedBy: 'Grupowanie',
		groupNone: 'Bez grupowania',
	},

	status: {
		/** `rows(1)` → "1 wiersz", `rows(3)` → "3 wiersze", `rows(12)` → "12 wierszy". */
		rows: (count: number) => `${ count } ${ pluralise(count, 'wiersz', 'wiersze', 'wierszy') }`,
		/** `filtered(4, 63)` → "4 z 63 wierszy". Genitive after "z", so always the `many` form. */
		filtered: (shown: number, total: number) => `${ shown } z ${ total } wierszy`,
	},

	filter: {
		add: 'Dodaj filtr',
		save: 'Zapisz',
		tabSimple: 'Filtr',
		tabAdvanced: 'Zaawansowany',
		advancedAlreadyExists: 'Może być tylko jeden filtr zaawansowany. Edytuj istniejący.',
		addRule: 'Dodaj regułę',
		fieldColumn: 'Kolumna',
		fieldCondition: 'Warunek',
		fieldValue: 'Wartość',
		fieldDate: 'Data',
		fieldColor: 'Kolor',
		colorRandom: 'Losowy kolor',
		colorChange: 'Zmień',
		selectPlaceholder: 'Wybierz…',
		/** Prefix on a negated value inside a badge, e.g. "nie Pilne". */
		notPrefix: 'nie ',
		/** `advancedBadge(3)` → "3 warunki". */
		advancedBadge: (count: number) => `${ count } ${ pluralise(count, 'warunek', 'warunki', 'warunków') }`,
		logic: {
			AND: 'ORAZ',
			OR: 'LUB',
		},
		expression: {
			label: 'Własne wyrażenie',
			placeholder: 'np. (1 ORAZ 2) LUB 3',
			hint: 'Numery odpowiadają regułom powyżej. Wyrażenie nadpisuje powyższe łączniki ORAZ/LUB.',
		},
		error: {
			invalidChars: 'Wyrażenie zawiera niedozwolone znaki.',
			unbalancedParentheses: 'Niedomknięty nawias.',
			unknownRule: 'Wyrażenie odwołuje się do nieistniejącej reguły.',
			malformed: 'Nieprawidłowa składnia wyrażenia.',
		},
	},

	sort: {
		none: 'Sortuj',
		/** `nSorts(2)` → "2 sortowania". */
		nSorts: (count: number) => `${ count } ${ pluralise(count, 'sortowanie', 'sortowania', 'sortowań') }`,
		title: 'Sortowanie',
		empty: 'Brak sortowania.',
		add: 'Dodaj sortowanie',
		ascending: 'Rosnąco',
		descending: 'Malejąco',
		remove: 'Usuń',
		reorder: 'Zmień kolejność',
	},

	cell: {
		empty: '—',
	},
} as const;

/** Operator names. */
export const operatorStrings = {
	equals: { select: 'równa się', badge: '=' },
	not_equals: { select: 'nie równa się', badge: '≠' },
	contains: { select: 'zawiera', badge: 'zawiera' },
	not_contains: { select: 'nie zawiera', badge: 'nie zawiera' },
	starts_with: { select: 'zaczyna się od', badge: 'zaczyna się od' },
	ends_with: { select: 'kończy się na', badge: 'kończy się na' },
	is_empty: { select: 'jest puste', badge: 'jest puste' },
	is_not_empty: { select: 'nie jest puste', badge: 'nie jest puste' },
	eq: { select: 'równa się', badge: '=' },
	neq: { select: 'nie równa się', badge: '≠' },
	gt: { select: 'większe niż', badge: '>' },
	lt: { select: 'mniejsze niż', badge: '<' },
	gte: { select: 'większe lub równe', badge: '≥' },
	lte: { select: 'mniejsze lub równe', badge: '≤' },
	date_is: { select: 'jest', badge: '=' },
	date_before: { select: 'przed', badge: 'przed' },
	date_after: { select: 'po', badge: 'po' },
	tag_is_any_of: { select: 'jest jednym z', badge: 'jest jednym z' },
	tag_is_none_of: { select: 'nie jest żadnym z', badge: 'nie jest żadnym z' },
} as const;

/**
 * Polish needs three forms, chosen by the last digit and the teens exception:
 * 1 wiersz, 2-4 wiersze, 5-21 wierszy, 22-24 wiersze.
 */
function pluralise(count: number, one: string, few: string, many: string): string {
	const abs = Math.abs(count);

	if (abs === 1) {
		return one;
	}

	const lastTwo = abs % 100;
	const last = abs % 10;

	if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
		return few;
	}

	return many;
}
