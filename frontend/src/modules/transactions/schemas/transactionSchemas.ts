import { z } from 'zod';
import type { TransactionType } from '../types/types.ts';


const AMOUNT_SHAPE = /^\d*([.,]\d{1,2})?$/;


function toNumber(value: string): number {
	return Number(value.trim().replace(',', '.'));
}


export function parseAmount(value: string): number {
	return toNumber(value);
}


const amountValue = z
	.string()
	.trim()
	.min(1, 'Podaj kwotę.')
	.refine((value) => !Number.isNaN(toNumber(value)), 'Kwota musi być liczbą.')
	.refine((value) => AMOUNT_SHAPE.test(value), 'Kwota może mieć najwyżej 2 miejsca po przecinku.')
	.refine((value) => toNumber(value) >= 0, 'Kwota nie może być ujemna.');

const quantityValue = z
	.string()
	.trim()
	.min(1, 'Podaj ilość.')
	.refine((value) => !Number.isNaN(toNumber(value)), 'Ilość musi być liczbą.')
	.refine((value) => AMOUNT_SHAPE.test(value), 'Ilość może mieć najwyżej 2 miejsca po przecinku.')
	.refine((value) => toNumber(value) >= 0, 'Ilość nie może być ujemna.');

const optionalDateValue = z
	.string()
	.refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Podaj poprawną datę.');

const transactionTypeValue: z.ZodType<TransactionType, TransactionType> = z.enum(['INCOME', 'EXPENSE']);


/* ── One income or expense row ───────────────────────────────────────────── */

export interface TransactionFormValues {
	name: string;
	type: TransactionType;
	amount: string;
	quantity: string;
	invoiceNumber: string;
	paymentDate: string;
	instructorId: string;
	note: string;
}


export const transactionFormSchema: z.ZodType<TransactionFormValues, TransactionFormValues> = z.object({
	name: z.string().trim().min(1, 'Podaj nazwę.').max(1024, 'Nazwa może mieć najwyżej 1024 znaki.'),
	type: transactionTypeValue,
	amount: amountValue,
	quantity: quantityValue,
	invoiceNumber: z.string().trim().max(64, 'Numer faktury może mieć najwyżej 64 znaki.'),
	paymentDate: optionalDateValue,
	instructorId: z.string(),
	note: z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.'),
});
