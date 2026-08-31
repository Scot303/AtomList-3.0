import { type Control, Controller, useFormState } from 'react-hook-form';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { FormSection } from '@/components/ui/fields';
import { coveredPersonLabel, type CoveredPersonView } from '@/types/finance.ts';
import type { CreditAllocationFormValues } from '../../schemas/depositSchemas';


interface CreditAllocationFieldsProps {
	control: Control<CreditAllocationFormValues>;
	coveredPersons: CoveredPersonView[];
	busy: boolean;
}


export function CreditAllocationFields({ control, coveredPersons, busy }: CreditAllocationFieldsProps) {
	const { errors } = useFormState({ control });

	const personOptions = coveredPersons.map((person) => ( {
		id: person.id,
		name: coveredPersonLabel(person),
	} ));

	return (
		<FormSection fields={ 1 }>
			<Controller
				control={ control }
				name="personIds"
				render={ ({ field }) => (
					<ExtendedSelect
						multiple
						label="Osoby do rozliczenia"
						options={ personOptions }
						value={ field.value }
						onChange={ field.onChange }
						onBlur={ field.onBlur }
						disabled={ busy }
						clearable
						error={ errors.personIds?.message }
						placeholder="Wybierz osoby"
					/>
				) }
			/>
		</FormSection>
	);
}
