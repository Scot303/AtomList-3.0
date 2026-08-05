import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Joins class names and lets a later Tailwind utility win over an earlier one in the same group,
 * so a caller can pass `className="px-8"` to a component that already sets `px-4` and get px-8.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}
