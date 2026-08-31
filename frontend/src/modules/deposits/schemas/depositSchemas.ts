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


const DEPOSIT_CODE = /^(w-)?\d{1,18}$/i;

export const depositCodeSchema: z.ZodType<DepositCodeFormValues, DepositCodeFormValues> = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'Podaj numer wpłaty.')
		.refine((value) => DEPOSIT_CODE.test(value), 'Numer wpłaty to np. „W-1234”.')
		.refine((value) => Number(value.replace(/^d-/i, '')) >= 1, 'Numery wpłat zaczynają się od 1.'),
});
