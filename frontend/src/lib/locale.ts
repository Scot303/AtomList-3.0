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
