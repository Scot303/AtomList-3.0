import { type Control, Controller, useFormState } from 'react-hook-form';
import { DatePicker, FormSection, Input } from '@/components/ui/fields';
import type { PersonFormValues } from '../../schemas/personSchemas';


interface PersonIdentitySectionProps {
	control: Control<PersonFormValues>;
	busy: boolean;
}


/**
 * Who the person is.
 */
export const PersonIdentitySection = ({ control, busy }: PersonIdentitySectionProps) => {
	const { register } = control;
	const { errors } = useFormState({ control });

	return (
		<FormSection title="Dane osobowe">
			<Input
				label="Imię"
				autoFocus
				autoComplete="off"
				maxLength={ 64 }
				disabled={ busy }
				error={ errors.name?.message }
				{ ...register('name') }
			/>

			<Input
				label="Nazwisko"
				autoComplete="off"
				maxLength={ 64 }
				disabled={ busy }
				error={ errors.lastName?.message }
				{ ...register('lastName') }
			/>

			<Controller
				control={ control }
				name="dateOfBirth"
				render={ ({ field }) => (
					<DatePicker
						label="Data urodzenia"
						value={ field.value }
						onChange={ field.onChange }
						onBlur={ field.onBlur }
						disabled={ busy }
						error={ errors.dateOfBirth?.message }
					/>
				) }
			/>
		</FormSection>
	);
};
