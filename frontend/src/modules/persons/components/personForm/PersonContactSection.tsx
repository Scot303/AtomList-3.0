import { type ChangeEvent, type KeyboardEvent } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Info } from 'lucide-react';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { fieldLabel, FormSection, Input } from '@/components/ui/fields';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { useFamilies } from '../../hooks/useFamilies';
import { type PersonFormValues, PHONE_DIGIT_COUNT } from '../../schemas/personSchemas';
import { formatFamilyName, formatPhone, phoneDigits } from '../../utils/personFormat';


const PHONE_FALLBACK_HINT = 'Gdy pole telefonu jest puste, do kontaktu używany jest numer rodziny - ' +
	'dzięki temu rodzeństwo dzieli jeden numer i wystarczy zmienić go w jednym miejscu. Własny numer osoby zawsze ma pierwszeństwo.';

const PHONE_MAX_LENGTH = formatPhone('0'.repeat(PHONE_DIGIT_COUNT)).length;

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


interface PersonContactSectionProps {
	form: UseFormReturn<PersonFormValues>;
	busy: boolean;
	familyPhone: string | null;
}

/**
 * How the person is reached, and which household they are reached through.
 */
export const PersonContactSection = ({ form, busy, familyPhone }: PersonContactSectionProps) => {
	const { register, control, formState: { errors } } = form;

	const families = useFamilies();

	const familyOptions = (families.data ?? []).map((family) => ({
		id: family.id,
		name: formatFamilyName(family),
	}));

	const phone = register('phone');

	const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.target;
		const caret = input.selectionStart ?? input.value.length;
		const digitsBeforeCaret = phoneDigits(input.value.slice(0, caret)).length;

		input.value = formatPhone(phoneDigits(input.value).slice(0, PHONE_DIGIT_COUNT));

		const nextCaret = caretAfterDigits(input.value, digitsBeforeCaret);
		input.setSelectionRange(nextCaret, nextCaret);

		void phone.onChange(event);
	};

	const handlePhoneKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const caret = input.selectionStart ?? 0;
		const hasSelection = caret !== input.selectionEnd;

		if (event.key === 'Backspace' && !hasSelection && input.value[caret - 1] === ' ') {
			input.setSelectionRange(caret - 1, caret - 1);
		}
	};

	return (
		<FormSection title="Kontakt">
			<div className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<Input
						label="Telefon"
						type="tel"
						autoComplete="off"
						inputMode="numeric"
						maxLength={ PHONE_MAX_LENGTH }
						disabled={ busy }
						error={ errors.phone?.message }
						placeholder={ familyPhone === null ? undefined : `Numer rodziny: ${ formatPhone(familyPhone) }` }
						{ ...phone }
						onChange={ handlePhoneChange }
						onKeyDown={ handlePhoneKeyDown }
					/>
				</div>

				<div className="flex shrink-0 flex-col">
					<span aria-hidden className={ fieldLabel() }>&nbsp;</span>

					<Tooltip
						content={ PHONE_FALLBACK_HINT }
						placement="right"
						className="items-center py-2.5 text-os-text-muted transition-colors hover:text-os-primary"
					>
						<Info className="size-5" aria-hidden="true"/>
						<span className="sr-only">{ PHONE_FALLBACK_HINT }</span>
					</Tooltip>
				</div>
			</div>

			<Input
				label="E-mail"
				type="email"
				autoComplete="off"
				spellCheck={ false }
				maxLength={ 255 }
				disabled={ busy }
				error={ errors.email?.message }
				{ ...register('email') }
			/>

			<Controller
				control={ control }
				name="familyId"
				render={ ({ field }) => (
					<ExtendedSelect
						label="Rodzina"
						options={ familyOptions }
						value={ field.value === '' ? undefined : field.value }
						onChange={ (value) => field.onChange(value ?? '') }
						onBlur={ field.onBlur }
						disabled={ busy || families.isPending }
						clearable
						placeholder={ families.isPending ? 'Wczytywanie…' : 'Brak' }
					/>
				) }
			/>
		</FormSection>
	);
};
