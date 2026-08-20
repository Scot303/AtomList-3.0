import { z } from 'zod';
import { parseAmount } from './paymentSchemas';
import type { ListPopulationMode } from '../types/types.ts';


/**
 * Mirrors the rules `CreateCustomListRequest` and `UpdateCustomListRequest` share.
 */

const nameValue = z
	.string()
	.trim()
	.min(1, 'Podaj nazwę listy.')
	.max(255, 'Nazwa może mieć najwyżej 255 znaków.');

const noteValue = z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.');

const populationModeValue: z.ZodType<ListPopulationMode, ListPopulationMode> = z.enum(['BY_GROUPS', 'BY_PERSONS']);

const AMOUNT_SHAPE = /^\d*([.,]\d{1,2})?$/;

const optionalAmountValue = z
	.string()
	.trim()
	.refine((value) => value === '' || !Number.isNaN(parseAmount(value)), 'Cena musi być liczbą.')
	.refine((value) => value === '' || AMOUNT_SHAPE.test(value), 'Cena może mieć najwyżej 2 miejsca po przecinku.')
	.refine((value) => value === '' || parseAmount(value) >= 0, 'Cena nie może być ujemna.');


export interface CustomListFormValues {
	name: string;
	campList: boolean;
	/** Creating only - how the list picks its people is fixed once it exists. */
	populationMode: ListPopulationMode;
	groupIds: string[];
	personIds: string[];
	fixedPrice: string;
	note: string;
}


export const customListFormSchema: z.ZodType<CustomListFormValues, CustomListFormValues> = z.object({
	name: nameValue,
	campList: z.boolean(),
	populationMode: populationModeValue,
	groupIds: z.array(z.string()),
	personIds: z.array(z.string()),
	fixedPrice: optionalAmountValue,
	note: noteValue,
});
