import { axiosInstance } from '@/api/axiosInstance';
import { DEPOSIT_ENDPOINTS } from '@/api/endpoints';
import type { AllocateDepositPayload, CreateDepositPayload, DepositPlanView, DepositView, PlanDepositPayload, } from '@/modules/paymentLists/types/types.ts';


/** The history of deposits, most recent first. Rows carry no settlements. */
export async function fetchDeposits(year: number | null): Promise<DepositView[]> {
	const params = year != null ? { year } : undefined;

	const { data } = await axiosInstance.get<DepositView[]>(DEPOSIT_ENDPOINTS.base, { params });

	return data;
}


/** One deposit, with what its money was spent on. */
export async function fetchDeposit(id: string): Promise<DepositView> {
	const { data } = await axiosInstance.get<DepositView>(DEPOSIT_ENDPOINTS.byId(id));

	return data;
}


/** One deposit, found by the code off a receipt - "W-1234", or just the number. */
export async function fetchDepositByCode(code: string): Promise<DepositView> {
	const { data } = await axiosInstance.get<DepositView>(DEPOSIT_ENDPOINTS.byCode(code));

	return data;
}


/** What a sum of money would settle, worked out without writing anything. */
export async function planDeposit(payload: PlanDepositPayload): Promise<DepositPlanView> {
	const { data } = await axiosInstance.post<DepositPlanView>(DEPOSIT_ENDPOINTS.plan, payload);

	return data;
}


/** Records the money and settles what the plan proposed. */
export async function createDeposit(payload: CreateDepositPayload): Promise<DepositView> {
	const { data } = await axiosInstance.post<DepositView>(DEPOSIT_ENDPOINTS.base, payload);

	return data;
}


/** Credit somebody has left over from earlier deposits. */
export async function fetchPersonCredit(personId: string): Promise<DepositView[]> {
	const { data } = await axiosInstance.get<DepositView[]>(DEPOSIT_ENDPOINTS.credit(personId));

	return data;
}


/** Spends what is left of a deposit: against the payments named, or wherever a fresh plan would put it. */
export async function allocateDeposit(id: string, payload: AllocateDepositPayload): Promise<DepositView> {
	const { data } = await axiosInstance.post<DepositView>(DEPOSIT_ENDPOINTS.allocate(id), payload);

	return data;
}


/**
 * Undoes one allocation, leaving that debt owing again and returning the money to this deposit's credit.
 *
 * Refused for money counted on a list that has since been closed: that figure has been sent to the accountants.
 */
export async function removeDepositSettlement(id: string, settlementId: string): Promise<DepositView> {
	const { data } = await axiosInstance.delete<DepositView>(DEPOSIT_ENDPOINTS.settlement(id, settlementId));

	return data;
}


/**
 * Removes a deposit recorded by mistake.
 *
 * Refused while any of it is still settling something: those have to be undone first, so it is always visible which debts are about to start owing again.
 */
export async function deleteDeposit(id: string): Promise<void> {
	await axiosInstance.delete(DEPOSIT_ENDPOINTS.byId(id));
}
