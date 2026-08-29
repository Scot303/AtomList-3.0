import { type ChangeEvent, type KeyboardEvent } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '@/components/ui/fields';
import { PHONE_DIGIT_COUNT } from '../schemas/personSchemas';
import { formatPhone, phoneDigits } from '../utils/personFormat';


/** The field holds the number grouped for reading, so it is wider than the digits alone. */
const PHONE_MAX_LENGTH = formatPhone('0'.repeat(PHONE_DIGIT_COUNT)).length;


/**
 * Where the caret belongs once `digitsBefore` digits have been typed, counting the spaces the grouping put in.
 */
function caretAfterDigits(formatted: string, digitsBefore: number): number {
	if (digitsBefore === 0) {
		return 0;
	}

	let seen = 0;

	for (let index = 0; index < formatted.length; index += 1) {
		if (formatted[index] !== ' ') {
			seen += 1;

			if (seen === digitsBefore) {
				return index + 1;
			}
		}
	}

	return formatted.length;
}


interface PhoneFieldProps {
	registration: UseFormRegisterReturn;
	label?: string;
	error?: string;
	disabled?: boolean;
	placeholder?: string;
}


/**
 * A phone number field that groups the digits as they are typed and keeps the caret where the typist left it rather than at the end of the regrouped value.
 */
export const PhoneField = ({ registration, label = 'Telefon', error, disabled, placeholder }: PhoneFieldProps) => {

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.target;
		const caret = input.selectionStart ?? input.value.length;
		const digitsBeforeCaret = phoneDigits(input.value.slice(0, caret)).length;

		input.value = formatPhone(phoneDigits(input.value).slice(0, PHONE_DIGIT_COUNT));

		const nextCaret = caretAfterDigits(input.value, digitsBeforeCaret);
		input.setSelectionRange(nextCaret, nextCaret);

		void registration.onChange(event);
	};

	/** Backspace over a grouping space should delete the digit before it, not the space. */
	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const caret = input.selectionStart ?? 0;
		const hasSelection = caret !== input.selectionEnd;

		if (event.key === 'Backspace' && !hasSelection && input.value[caret - 1] === ' ') {
			input.setSelectionRange(caret - 1, caret - 1);
		}
	};

	return (
		<Input
			label={ label }
			type="phone"
			autoComplete="off"
			inputMode="numeric"
			maxLength={ PHONE_MAX_LENGTH }
			disabled={ disabled }
			error={ error }
			placeholder={ placeholder }
			{ ...registration }
			onChange={ handleChange }
			onKeyDown={ handleKeyDown }
		/>
	);
};
