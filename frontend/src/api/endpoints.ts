export const AUTH_ENDPOINTS = {
	requestLoginCode: '/api/auth/otp/request',
	verifyLoginCode: '/api/auth/otp/verify',
	refresh: '/api/auth/refresh',
	me: '/api/auth/me',
	logout: '/api/auth/logout',
	logoutEverywhere: '/api/auth/logout-all',
	verifyEmail: '/api/auth/email/verify',
	resendVerification: '/api/auth/email/resend',
} as const;

/**
 * Endpoints reached before anyone is signed in, which must be called without an Authorization header.
 */
export const ANONYMOUS_PATHS: readonly string[] = [
	AUTH_ENDPOINTS.requestLoginCode,
	AUTH_ENDPOINTS.verifyLoginCode,
	AUTH_ENDPOINTS.verifyEmail,
	AUTH_ENDPOINTS.resendVerification,
];

/**
 * Endpoints that must never trigger the "401 means the access token lapsed, renew it and retry" path.
 * A 401 from any of these is the answer, not a stale token.
 * Retrying would spend the refresh cookie for nothing and hide the real error.
 */
export const NO_TOKEN_RENEWAL_PATHS: readonly string[] = [
	AUTH_ENDPOINTS.requestLoginCode,
	AUTH_ENDPOINTS.verifyLoginCode,
	AUTH_ENDPOINTS.refresh,
	AUTH_ENDPOINTS.logout,
	AUTH_ENDPOINTS.verifyEmail,
	AUTH_ENDPOINTS.resendVerification,
];


/**  MODULES  */

const ADMIN_USERS = '/api/admin/users';
const PERSONS = '/api/persons';
const GROUPS = '/api/groups';
const MEMBERSHIPS = '/api/memberships';
const FAMILIES = '/api/families';
const LISTS = '/api/lists';
const PAYMENTS = '/api/payments';
const DEPOSITS = '/api/deposits';
const ATTENDANCE = '/api/attendance';
const SMS = '/api/sms';


/**
 * Account administration. Every one of these needs the `MANAGE_USERS` authority.
 */
export const ADMIN_USER_ENDPOINTS = {
	base: ADMIN_USERS,
	byId: (id: string) => `${ ADMIN_USERS }/${ id }`,
	unlock: (id: string) => `${ ADMIN_USERS }/${ id }/unlock`,
	resendVerification: (id: string) => `${ ADMIN_USERS }/${ id }/resend-verification`,
	forceLogout: (id: string) => `${ ADMIN_USERS }/${ id }/force-logout`,
} as const;


/**
 * `READ_PERSONS` / `MODIFY_PERSONS`.
 */
export const PERSON_ENDPOINTS = {
	base: PERSONS,
	byId: (id: string) => `${ PERSONS }/${ id }`,
	memberships: (personId: string) => `${ PERSONS }/${ personId }/memberships`,
	discounts: (personId: string) => `${ PERSONS }/${ personId }/discounts`,
} as const;


/**
 * `READ_GROUPS` / `MODIFY_GROUPS`.
 */
export const GROUP_ENDPOINTS = {
	base: GROUPS,
	byId: (id: string) => `${ GROUPS }/${ id }`,
	attendanceList: (groupId: string) => `${ ATTENDANCE }/${ groupId }`,
} as const;


/**
 * `MODIFY_PERSONS`.
 */
export const MEMBERSHIP_ENDPOINTS = {
	base: MEMBERSHIPS,
	byId: (id: string) => `${ MEMBERSHIPS }/${ id }`,
	leave: (id: string) => `${ MEMBERSHIPS }/${ id }/leave`,
} as const;


/** `READ_FAMILIES` / `MODIFY_FAMILIES`. */
export const FAMILY_ENDPOINTS = {
	base: FAMILIES,
	byId: (id: string) => `${ FAMILIES }/${ id }`,
	members: (id: string) => `${ FAMILIES }/${ id }/members`,
} as const;


/**
 * `READ_LISTS` / `MODIFY_LISTS` / `CLOSE_LISTS`.
 */
export const PAYMENT_LIST_ENDPOINTS = {
	base: LISTS,
	byId: (id: string) => `${ LISTS }/${ id }`,
	custom: `${ LISTS }/custom`,
	seasonSummary: (startYear: number) => `${ LISTS }/summary/${ startYear }`,
	standard: (year: number, month: number) => `${ LISTS }/standard/${ year }/${ month }`,
	report: (id: string) => `${ LISTS }/${ id }/report`,
	overpayments: (id: string) => `${ LISTS }/${ id }/overpayments`,
	settleOverpayments: (id: string) => `${ LISTS }/${ id }/overpayments/settle`,
	repopulate: (id: string) => `${ LISTS }/${ id }/repopulate`,
	persons: (id: string) => `${ LISTS }/${ id }/persons`,
	recalculate: (id: string) => `${ LISTS }/${ id }/recalculate`,
	close: (id: string) => `${ LISTS }/${ id }/close`,
	reopen: (id: string) => `${ LISTS }/${ id }/reopen`,
} as const;


/**
 * `READ_PAYMENTS` / `MODIFY_PAYMENTS`.
 */
export const PAYMENT_ENDPOINTS = {
	base: PAYMENTS,
	forList: (listId: string) => `${ LISTS }/${ listId }/payments`,
	byId: (id: string) => `${ PAYMENTS }/${ id }`,
	settle: (id: string) => `${ PAYMENTS }/${ id }/settle`,
	quantity: (id: string) => `${ PAYMENTS }/${ id }/quantity`,
} as const;


/**
 * `READ_PAYMENTS` / `MODIFY_PAYMENTS`.
 */
export const DEPOSIT_ENDPOINTS = {
	base: DEPOSITS,
	byId: (id: string) => `${ DEPOSITS }/${ id }`,
	byCode: (code: string) => `${ DEPOSITS }/by-code/${ encodeURIComponent(code) }`,
	plan: `${ DEPOSITS }/plan`,
	credit: (personId: string) => `${ DEPOSITS }/credit/${ personId }`,
	allocate: (id: string) => `${ DEPOSITS }/${ id }/allocate`,
	settlement: (id: string, settlementId: string) => `${ DEPOSITS }/${ id }/settlements/${ settlementId }`,
} as const;


/**
 * `READ_SMS` / `SEND_SMS`.
 */
export const SMS_ENDPOINTS = {
	base: SMS,
} as const;
