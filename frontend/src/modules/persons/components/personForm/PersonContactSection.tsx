import { type Control, Controller, useFormState } from 'react-hook-form';
import { Info } from 'lucide-react';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { fieldLabel, FormSection, Input } from '@/components/ui/fields';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { FamilyCreateForm } from '../familyList/FamilyCreateForm';
import { PhoneField } from '../PhoneField';
import { useFamilies } from '../../hooks/queries/useFamilies.ts';
import { type PersonFormValues } from '../../schemas/personSchemas';
import { formatFamilyName, formatPhone } from '../../utils/personFormat';


const PHONE_FALLBACK_HINT = 'Gdy pole telefonu jest puste, do kontaktu używany jest numer rodziny - ' +
	'dzięki temu rodzeństwo dzieli jeden numer i wystarczy zmienić go w jednym miejscu. Własny numer osoby zawsze ma pierwszeństwo.';


interface PersonContactSectionProps {
	control: Control<PersonFormValues>;
	busy: boolean;
	familyPhone: string | null;
}


/**
 * How the person is reached, and which household they are reached through.
 */
export const PersonContactSection = ({ control, busy, familyPhone }: PersonContactSectionProps) => {
	const { register } = control;
	const { errors } = useFormState({ control });

	const { hasPermission } = useAuth();

	const families = useFamilies();

	const familyOptions = ( families.data ?? [] ).map((family) => ( {
		id: family.id,
		name: formatFamilyName(family),
	} ));

	return (
		<FormSection title="Kontakt">
			<div className="flex items-start gap-2">
				<div className="min-w-0 flex-1">
					<PhoneField
						registration={ register('phone') }
						disabled={ busy }
						error={ errors.phone?.message }
						placeholder={ familyPhone === null ? undefined : `Numer rodziny: ${ formatPhone(familyPhone) }` }
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
						addNew={ hasPermission('MODIFY_FAMILIES') ? {
							label: 'Nowa rodzina',
							renderForm: (onCancel, onSaved) => <FamilyCreateForm onCancel={ onCancel } onCreated={ onSaved }/>,
						} : undefined }
					/>
				) }
			/>
		</FormSection>
	);
};
