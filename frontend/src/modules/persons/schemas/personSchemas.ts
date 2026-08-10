import { z } from 'zod';

/**
 * Mirrors `UpdatePersonRequest`'s rules.
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

/** Nine digits after the separators the backend strips. */
const phoneValue = z
	.string()
	.trim()
	.refine(
		(value) => value === '' || /^[0-9\s()\-.+]*$/.test(value),
		'Numer może zawierać tylko cyfry, spacje i znaki - ( ) .',
	)
	.refine(
		(value) => value === '' || value.replace(/[\s()\-.]/g, '').length <= 9,
		'Numer telefonu może mieć najwyżej 9 cyfr.',
	);

const emailValue = z
	.string()
	.trim()
	.max(255, 'Adres e-mail jest za długi.')
	.refine((value) => value === '' || z.email().safeParse(value).success, 'Podaj poprawny adres e-mail.');

const noteValue = z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.');

export interface PersonDetailsFormValues {
	name: string;
	lastName: string;
	/** `YYYY-MM-DD`, or `''`. */
	dateOfBirth: string;
	phone: string;
	email: string;
	familyId: string;
	joinedStudioAt: string;
	active: boolean;
	contractSigned: boolean;
	note: string;
}

export const personDetailsSchema: z.ZodType<PersonDetailsFormValues, PersonDetailsFormValues> = z.object({
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
