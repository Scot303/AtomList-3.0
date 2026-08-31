import { z } from 'zod';
import type { ContractType } from '../types/types.ts';


const nameValue = z
	.string()
	.trim()
	.min(1, 'Podaj imię.')
	.max(128, 'Imię może mieć najwyżej 128 znaków.');

const lastNameValue = z
	.string()
	.trim()
	.min(1, 'Podaj nazwisko.')
	.max(128, 'Nazwisko może mieć najwyżej 128 znaków.');

const costValue = z
	.string()
	.trim()
	.min(1, 'Podaj stawkę godzinową.')
	.refine((value) => !Number.isNaN(Number(value.replace(',', '.'))), 'Stawka musi być liczbą.')
	.refine((value) => Number(value.replace(',', '.')) >= 0, 'Stawka nie może być ujemna.')
	.refine(
		(value) => /^\d*([.,]\d{1,2})?$/.test(value),
		'Stawka może mieć najwyżej 2 miejsca po przecinku.',
	);

const contractNumberValue = z.string().trim().max(64, 'Numer umowy może mieć najwyżej 64 znaki.');

const signedDateValue = z
	.string()
	.refine((value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Podaj poprawną datę.');

const noteValue = z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.');

const contractTypeValue: z.ZodType<ContractType, ContractType> = z.enum(['OPEN', 'TOURNAMENT']);


export interface InstructorFormValues {
	name: string;
	lastName: string;
	costPerHour: string;
	contractType: ContractType;
	contractSignedDate: string;
	contractNumber: string;
	active: boolean;
	note: string;
}


export const instructorFormSchema: z.ZodType<InstructorFormValues, InstructorFormValues> = z.object({
	name: nameValue,
	lastName: lastNameValue,
	costPerHour: costValue,
	contractType: contractTypeValue,
	contractSignedDate: signedDateValue,
	contractNumber: contractNumberValue,
	active: z.boolean(),
	note: noteValue,
});


export function parseCost(value: string): number {
	return Number(value.trim().replace(',', '.'));
}
