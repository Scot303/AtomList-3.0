import { z } from 'zod';
import type { PaymentMethod } from '@/types/finance.ts';


const AMOUNT_SHAPE = /^\d*([.,]\d{1,2})?$/;


function toNumber(value: string): number {
	return Number(value.trim().replace(',', '.'));
}


export function parseAmount(value: string): number {
	return toNumber(value);
}


/**
 * A money field. `min` is what the backend's own `@DecimalMin` says: zero for a charge, a penny for a handover -
 * there is no such thing as receiving nothing.
 */
function amountValue(min: 0 | 0.01) {
	return z
		.string()
		.trim()
		.min(1, `Podaj kwotę.`)
		.refine((value) => !Number.isNaN(toNumber(value)), `Kwota musi być liczbą.`)
		.refine((value) => AMOUNT_SHAPE.test(value), `Kwota może mieć najwyżej 2 miejsca po przecinku.`)
		.refine(
			(value) => toNumber(value) >= min,
			min === 0 ? `Kwota nie może być ujemna.` : `Kwota musi być większa od zera.`,
		);
}


const quantityValue = z
	.string()
	.trim()
	.min(1, 'Podaj ilość.')
	.refine((value) => !Number.isNaN(toNumber(value)), 'Ilość musi być liczbą.')
	.refine((value) => AMOUNT_SHAPE.test(value), 'Ilość może mieć najwyżej 2 miejsca po przecinku.')
	.refine((value) => toNumber(value) >= 0, 'Ilość nie może być ujemna.');

const noteValue = z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.');

const paymentMethodValue: z.ZodType<PaymentMethod, PaymentMethod> = z.enum(['TRANSFER', 'CASH', 'BLIK']);

const dateValue = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Podaj poprawną datę.');


/* ── A charge added by hand ──────────────────────────────────────────────── */

export interface OneOffFormValues {
	personId: string;
	groupId: string;
	description: string;
	unitCost: string;
	quantity: string;
}


/**
 * Which of `groupId` and `description` is required depends on the list, so - like `personId`, which only applies
 * while adding - the one that applies is checked on submit rather than here.
 */
export const oneOffFormSchema: z.ZodType<OneOffFormValues, OneOffFormValues> = z.object({
	personId: z.string(),
	groupId: z.string(),
	description: z.string().trim().max(255, 'Opis może mieć najwyżej 255 znaków.'),
	unitCost: amountValue(0),
	quantity: quantityValue,
});


/* ── How many classes were attended ──────────────────────────────────────── */

export interface QuantityFormValues {
	quantity: string;
}


export const quantityFormSchema: z.ZodType<QuantityFormValues, QuantityFormValues> = z.object({
	quantity: quantityValue,
});


/* ── The note, and a camp contract ───────────────────────────────────────── */

export interface PaymentEditFormValues {
	note: string;
	contractReturned: boolean;
}


export const paymentEditFormSchema: z.ZodType<PaymentEditFormValues, PaymentEditFormValues> = z.object({
	note: noteValue,
	contractReturned: z.boolean(),
});


/* ── Money handed over ───────────────────────────────────────────────────── */

export interface SettleFormValues {
	receivedAt: string;
	amount: string;
	paymentMethod: PaymentMethod;
	note: string;
}


export const settleFormSchema: z.ZodType<SettleFormValues, SettleFormValues> = z.object({
	receivedAt: dateValue,
	amount: amountValue(0.01),
	paymentMethod: paymentMethodValue,
	note: noteValue,
});


export interface DepositFormValues {
	personIds: string[];
	amount: string;
	paymentMethod: PaymentMethod;
	receivedAt: string;
	note: string;
}


export const depositFormSchema: z.ZodType<DepositFormValues, DepositFormValues> = z.object({
	personIds: z.array(z.string()).min(1, 'Wybierz co najmniej jedną osobę.'),
	amount: amountValue(0.01),
	paymentMethod: paymentMethodValue,
	receivedAt: dateValue,
	note: noteValue,
});


/* ── Spending leftover credit ────────────────────────────────────────────── */

export interface AllocateFormValues {
	depositId: string;
	amount: string;
}


export const allocateFormSchema: z.ZodType<AllocateFormValues, AllocateFormValues> = z.object({
	depositId: z.string().min(1, 'Wybierz wpłatę, z której rozliczyć tą pozycję.'),
	amount: amountValue(0.01),
});


/* ── What the forms hand to the API ──────────────────────────────────────── */

/**
 * A picked day as the instant the backend wants.
 *
 * Midday local time, not midnight: whichever way the studio's zone sits against UTC, the timestamp still lands on
 * the day that was picked - and so in the month that has to report the cash.
 */
export function toInstant(day: string): string {
	return new Date(`${ day }T12:00:00`).toISOString();
}


/** An optional text field, left out entirely when it is empty. */
export function optionalText(value: string): string | undefined {
	const trimmed = value.trim();

	return trimmed === '' ? undefined : trimmed;
}
