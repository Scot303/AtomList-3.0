import { axiosInstance } from '@/api/axiosInstance';
import { PAYMENT_LIST_ENDPOINTS } from '@/api/endpoints';
import type {
	AddPersonsPayload,
	CreateCustomListPayload,
	CreditSweepResultView,
	CreditSweepView,
	ListReportView,
	MonthSummaryView,
	PaymentListView,
	SettleCreditPayload,
	UpdateCustomListPayload,
} from '../types/types.ts';


export async function fetchCustomLists(): Promise<PaymentListView[]> {
	const { data } = await axiosInstance.get<PaymentListView[]>(PAYMENT_LIST_ENDPOINTS.custom);

	return data;
}


export async function fetchPaymentList(id: string): Promise<PaymentListView> {
	const { data } = await axiosInstance.get<PaymentListView>(PAYMENT_LIST_ENDPOINTS.byId(id));

	return data;
}


/**
 * One season of monthly sheets - September of `startYear` to the following August, in that order.
 */
export async function fetchSeasonSummary(startYear: number): Promise<MonthSummaryView[]> {
	const { data } = await axiosInstance.get<MonthSummaryView[]>(PAYMENT_LIST_ENDPOINTS.seasonSummary(startYear));

	return data;
}


/**
 * A month's standard list, created on the spot when it does not exist yet.
 */
export async function openStandardList(year: number, month: number, tournament: boolean): Promise<PaymentListView> {
	const { data } = await axiosInstance.get<PaymentListView>(PAYMENT_LIST_ENDPOINTS.standard(year, month), {
		params: { tournament, create: true },
	});

	return data;
}


export async function createCustomList(payload: CreateCustomListPayload): Promise<PaymentListView> {
	const { data } = await axiosInstance.post<PaymentListView>(PAYMENT_LIST_ENDPOINTS.custom, payload);

	return data;
}


export async function updateCustomList(id: string, payload: UpdateCustomListPayload): Promise<PaymentListView> {
	const { data } = await axiosInstance.patch<PaymentListView>(PAYMENT_LIST_ENDPOINTS.byId(id), payload);

	return data;
}


/** Everything the list says on paper: the money taken in for the period, where it went, and the totals. */
export async function fetchListReport(id: string): Promise<ListReportView> {
	const { data } = await axiosInstance.get<ListReportView>(PAYMENT_LIST_ENDPOINTS.report(id));

	return data;
}


/**
 * Every bit of leftover credit that could be spent on this list, and what each bit would settle here.
 */
export async function fetchOverpayments(id: string): Promise<CreditSweepView> {
	const { data } = await axiosInstance.get<CreditSweepView>(PAYMENT_LIST_ENDPOINTS.overpayments(id));

	return data;
}


/** Spends that credit, settling what the plan proposed. */
export async function settleOverpayments(id: string, payload: SettleCreditPayload): Promise<CreditSweepResultView> {
	const { data } = await axiosInstance.post<CreditSweepResultView>(PAYMENT_LIST_ENDPOINTS.settleOverpayments(id), payload);

	return data;
}


/**
 * Rebuilds every amount from the current memberships and discount configuration.
 *
 * Needed after a group price change, a membership change, somebody moving between families, or a discount edit.
 */
export async function recalculateList(id: string): Promise<PaymentListView> {
	const { data } = await axiosInstance.post<PaymentListView>(PAYMENT_LIST_ENDPOINTS.recalculate(id));

	return data;
}


/** Replays how a custom list chose its people, adding anybody who now qualifies. Never removes. */
export async function repopulateList(id: string): Promise<PaymentListView> {
	const { data } = await axiosInstance.post<PaymentListView>(PAYMENT_LIST_ENDPOINTS.repopulate(id));

	return data;
}


/** Puts people on the list, each with one charge to fill in. Anybody the charge would duplicate is skipped. */
export async function addPersonsToList(id: string, payload: AddPersonsPayload): Promise<PaymentListView> {
	const { data } = await axiosInstance.post<PaymentListView>(PAYMENT_LIST_ENDPOINTS.persons(id), payload);

	return data;
}


/** Freezes the figures for the accountants. */
export async function closeList(id: string): Promise<PaymentListView> {
	const { data } = await axiosInstance.post<PaymentListView>(PAYMENT_LIST_ENDPOINTS.close(id));

	return data;
}


export async function reopenList(id: string): Promise<PaymentListView> {
	const { data } = await axiosInstance.post<PaymentListView>(PAYMENT_LIST_ENDPOINTS.reopen(id));

	return data;
}


/** Only for a list created by mistake: refused once closed or once any money has been recorded on it. */
export async function deletePaymentList(id: string): Promise<void> {
	await axiosInstance.delete(PAYMENT_LIST_ENDPOINTS.byId(id));
}
