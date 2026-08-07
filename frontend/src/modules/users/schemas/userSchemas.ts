import { z } from 'zod';
import { type Permission, PERMISSIONS, type Role, ROLES } from '@/types/auth';

/**
 * Mirrors `CreateUserRequest`'s rules, so a value the backend will refuse never leaves the browser.
 */
const usernameValue = z
	.string()
	.trim()
	.min(3, 'Login musi mieć od 3 do 64 znaków.')
	.max(64, 'Login musi mieć od 3 do 64 znaków.')
	.regex(
		/^[\p{L}\p{N}._-]+$/u,
		'Login może zawierać tylko litery, cyfry, kropki, podkreślenia i myślniki.',
	);

const emailValue = z
	.string()
	.trim()
	.min(1, 'Podaj adres e-mail.')
	.max(255, 'Adres e-mail jest za długi.')
	.email('Podaj poprawny adres e-mail.');

export interface EditUserFormValues {
	username: string;
	email: string;
}

export const editUserSchema: z.ZodType<EditUserFormValues, EditUserFormValues> = z.object({
	username: usernameValue,
	email: emailValue,
});

export interface CreateUserFormValues {
	username: string;
	email: string;
	role: Role;
	additionalPermissions: Permission[];
}

export const createUserSchema: z.ZodType<CreateUserFormValues, CreateUserFormValues> = z.object({
	username: usernameValue,
	email: emailValue,
	role: z.enum(ROLES),
	additionalPermissions: z.array(z.enum(PERMISSIONS)),
});
