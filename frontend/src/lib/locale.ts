/**
 * The app's single locale.
 *
 * Places that need a locale - collation, month and weekday names, date formatting - should agree on one,
 * and should read it from here rather than each hardcoding a string.
 *
 * Adding a second language later means changing this file's shape, not hunting for `'pl'` across the codebase.
 */
export const LOCALE = 'pl-PL';

/** Monday, as every Polish calendar starts. 0 = Sunday, per `Date.prototype.getDay`. */
export const FIRST_DAY_OF_WEEK = 1;

/**
 * The zone the business runs in, matching the backend's `app.time-zone`.
 */
export const TIME_ZONE = 'Europe/Warsaw';

/** The one currency the studio bills in. */
export const CURRENCY = 'PLN';

const currencyFormat = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

export function formatCurrency(amount: number | string | null | undefined): string {
	if (amount === null || amount === undefined || amount === '') {
		return '';
	}

	const value = typeof amount === 'number' ? amount : Number(amount);

	return Number.isNaN(value) ? '' : currencyFormat.format(value);
}

/**
 * A whole-number percentage as the backend sends them - 10 means 10%.
 * Trailing zeros are dropped, so a `BigDecimal` serialised as `10.00` reads as `10%` rather than `10,00%`.
 */
const percentFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

export function formatPercent(percent: number | string | null | undefined): string {
	if (percent === null || percent === undefined || percent === '') {
		return '';
	}

	const value = typeof percent === 'number' ? percent : Number(percent);

	return Number.isNaN(value) ? '' : `${ percentFormat.format(value) }%`;
}
