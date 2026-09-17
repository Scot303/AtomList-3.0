import { z } from 'zod';


/* ── Spending what is left of a handover ─────────────────────────────────── */

export interface CreditAllocationFormValues {
	personIds: string[];
}


export const creditAllocationSchema: z.ZodType<CreditAllocationFormValues, CreditAllocationFormValues> = z.object({
	personIds: z.array(z.string()).min(1, 'Wybierz co najmniej jedną osobę.'),
});


/* ── Finding a handover by the code ─────────────────────────── */

export interface DepositCodeFormValues {
	code: string;
}


/** The prefix and the year are both optional - a bare number is read as this year's. */
const DEPOSIT_CODE = /^(w-)?\d{1,18}(\/(\d{2}|\d{4}))?$/i;


/** Just the number half, with the `W-` prefix and any `/26` year taken off. */
function numberIn(code: string): number {
	return Number(code.replace(/^w-/i, '').split('/')[0]);
}


export const depositCodeSchema: z.ZodType<DepositCodeFormValues, DepositCodeFormValues> = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'Podaj numer wpłaty.')
		.refine((value) => DEPOSIT_CODE.test(value), 'Numer wpłaty to np. „W-1234/26”.')
		.refine((value) => numberIn(value) >= 1, 'Numery wpłat zaczynają się od 1.'),
});
