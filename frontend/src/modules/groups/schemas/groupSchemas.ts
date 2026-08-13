import { z } from 'zod';
import type { GroupBillingType } from '../types/types.ts';

/**
 * Mirrors the rules `CreateGroupRequest` and `UpdateGroupRequest` share.
 */

const nameValue = z
	.string()
	.trim()
	.min(1, 'Podaj nazwę grupy.')
	.max(128, 'Nazwa może mieć najwyżej 128 znaków.');

/**
 * Held as text because that is what the field gives back, and because a half-typed amount has to
 * survive being typed. A comma reads as a decimal point, as it does on a Polish keyboard.
 */
const costValue = z
	.string()
	.trim()
	.min(1, 'Podaj koszt uczestnictwa.')
	.refine((value) => !Number.isNaN(Number(value.replace(',', '.'))), 'Koszt musi być liczbą.')
	.refine((value) => Number(value.replace(',', '.')) >= 0, 'Koszt nie może być ujemny.')
	.refine(
		(value) => /^\d*([.,]\d{1,2})?$/.test(value),
		'Koszt może mieć najwyżej 2 miejsca po przecinku.',
	);

const colorValue = z
	.string()
	.trim()
	.refine((value) => value === '' || /^[0-9A-Fa-f]{6}$/.test(value), 'Kolor musi mieć 6 znaków szesnastkowych.');

const noteValue = z.string().trim().max(512, 'Notatka może mieć najwyżej 512 znaków.');

const billingTypeValue: z.ZodType<GroupBillingType, GroupBillingType> = z.enum(['MONTHLY', 'PER_CLASS']);


export interface GroupFormValues {
	name: string;
	tournamentGroup: boolean;
	costForAttending: string;
	billingType: GroupBillingType;
	/** Editing only - a new group is always created active. */
	active: boolean;
	/** Six hex digits, no leading `#`. */
	color: string;
	note: string;
}

export const groupFormSchema: z.ZodType<GroupFormValues, GroupFormValues> = z.object({
	name: nameValue,
	tournamentGroup: z.boolean(),
	costForAttending: costValue,
	billingType: billingTypeValue,
	active: z.boolean(),
	color: colorValue,
	note: noteValue,
});

/** The typed amount as a number. Only ever called on a value the schema has already accepted. */
export function parseCost(value: string): number {
	return Number(value.trim().replace(',', '.'));
}
