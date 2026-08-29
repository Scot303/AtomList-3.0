import { z } from 'zod';
import { phoneValue } from './personSchemas';


/**
 * Mirrors `CreateUpdateFamilyRequest`.
 */

const nameValue = z
	.string()
	.trim()
	.min(1, 'Podaj nazwę rodziny.')
	.max(128, 'Nazwa rodziny może mieć najwyżej 128 znaków.');

const noteValue = z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.');


export interface FamilyFormValues {
	name: string;
	phone: string;
	note: string;
}


export const familyFormSchema: z.ZodType<FamilyFormValues, FamilyFormValues> = z.object({
	name: nameValue,
	phone: phoneValue,
	note: noteValue,
});
