import { z } from 'zod';
import { type Permission, PERMISSIONS, type Role, ROLES } from '@/types/auth';

/** The two fields an administrator edits through a form rather than a badge. */
export type EditableUserField = 'username' | 'email';

export interface UserFieldFormValues {
	value: string;
}

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

const usernameSchema = z.object({ value: usernameValue });

const emailSchema = z.object({ value: emailValue });

interface UserFieldConfig {
	title: string;
	label: string;
	/** Both type arguments are pinned so `zodResolver` can tie the form's values to the schema's. */
	schema: z.ZodType<UserFieldFormValues, UserFieldFormValues>;
	maxLength: number;
	notice?: string;
}

/**
 * Everything the edit modal needs to know about a field, so the modal itself stays generic.
 */
export const USER_FIELD_CONFIG: Record<EditableUserField, UserFieldConfig> = {
	username: {
		title: 'Zmień login',
		label: 'Login',
		schema: usernameSchema,
		maxLength: 64,
		notice: 'Zmiana loginu zakończy wszystkie sesje tego konta.',
	},
	email: {
		title: 'Zmień adres e-mail',
		label: 'Adres e-mail',
		schema: emailSchema,
		maxLength: 255,
		notice: 'Nowy adres wymaga potwierdzenia. Do czasu potwierdzenia konto nie będzie mogło się zalogować, a wszystkie sesje zostaną zakończone.',
	},
};

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
