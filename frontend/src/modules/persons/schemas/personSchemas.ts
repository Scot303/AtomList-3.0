import { z } from 'zod';


/**
 * Mirrors the rules `CreatePersonRequest` and `UpdatePersonRequest` share.
 */

const nameValue = z
	.string()
	.trim()
	.min(1, 'Podaj imię.')
	.max(64, 'Imię może mieć najwyżej 64 znaki.');

const lastNameValue = z
	.string()
	.trim()
	.min(1, 'Podaj nazwisko.')
	.max(64, 'Nazwisko może mieć najwyżej 64 znaki.');


/** The field holds the number grouped for reading, so its own spaces are the only separator allowed. */
const phoneSpaces = /\s/g;

/** A whole number, no shorter. */
export const PHONE_DIGIT_COUNT = 9;


export const phoneValue = z
	.string()
	.trim()
	.refine(
		(value) => value === '' || /^[0-9\s]*$/.test(value),
		'Numer telefonu może zawierać tylko cyfry.',
	)
	.refine(
		// Left empty on purpose is still fine - the family's number then stands in for it.
		(value) => value === '' || value.replace(phoneSpaces, '').length === PHONE_DIGIT_COUNT,
		'Numer telefonu musi mieć 9 cyfr.',
	)
	.transform((value) => value.replace(phoneSpaces, ''));

const emailValue = z
	.string()
	.trim()
	.max(255, 'Adres e-mail jest za długi.')
	.refine((value) => value === '' || z.email().safeParse(value).success, 'Podaj poprawny adres e-mail.');

const noteValue = z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.');


/**
 * What the person form holds, whether it is filling in a new person or editing one.
 */
export interface PersonFormValues {
	name: string;
	lastName: string;
	/** `YYYY-MM-DD`, or `''`. */
	dateOfBirth: string;
	phone: string;
	email: string;
	/** A family's id, or `''` for no household. */
	familyId: string;
	joinedStudioAt: string;
	/** Editing only - a new person is always created active. */
	active: boolean;
	contractSigned: boolean;
	note: string;
}


export const personFormSchema: z.ZodType<PersonFormValues, PersonFormValues> = z.object({
	name: nameValue,
	lastName: lastNameValue,
	dateOfBirth: z.string(),
	phone: phoneValue,
	email: emailValue,
	familyId: z.string(),
	joinedStudioAt: z.string().min(1, 'Podaj datę dołączenia.'),
	active: z.boolean(),
	contractSigned: z.boolean(),
	note: noteValue,
});
