import { z } from 'zod';
import { LOGIN_CODE_LENGTH, normalizeLoginCode } from '../constants';

export const identifierSchema = z.object({
	identifier: z
		.string()
		.trim()
		.min(1, 'Podaj login lub adres e-mail.')
		.max(255, 'Login lub adres e-mail jest za długi.'),
});

export type IdentifierFormValues = z.infer<typeof identifierSchema>;

export const loginCodeSchema = z.object({
	code: z
		.string()
		.refine(
			(value) => normalizeLoginCode(value).length === LOGIN_CODE_LENGTH,
			`Kod logowania ma ${ LOGIN_CODE_LENGTH } znaków.`,
		),
});

export type LoginCodeFormValues = z.infer<typeof loginCodeSchema>;
