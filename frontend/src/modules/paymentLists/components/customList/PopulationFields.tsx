import { type Control, Controller, useFormState, useWatch } from 'react-hook-form';
import { Info } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { ExtendedSelect, type ExtendedSelectOption } from '@/components/ui/extendedSelect';
import { Toggle } from '@/components/ui/fields';
import { TagSelect } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { buildGroupOptions } from '@/modules/groups/types/groupRows.ts';
import { usePersons } from '@/modules/persons/hooks/queries/usePersons.ts';
import { toPersonOptions } from '@/modules/persons/utils/personOptions';
import type { CustomListFormValues } from '../../schemas/listSchemas';


const POPULATION_OPTIONS: ExtendedSelectOption[] = [
	{ id: 'BY_GROUPS', name: 'Grup', hint: 'wszyscy zapisani do grupy' },
	{ id: 'BY_PERSONS', name: 'Wybranych osób', hint: 'ręcznie wybrane osoby' },
];


interface PopulationFieldsProps {
	control: Control<CustomListFormValues>;
	busy: boolean;
}


export function PopulationFields({ control, busy }: PopulationFieldsProps) {
	const persons = usePersons();
	const groups = useGroups();

	const { errors } = useFormState({ control });

	const byGroups = useWatch({ control, name: 'populationMode' }) === 'BY_GROUPS';

	const groupOptions = buildGroupOptions(( groups.data ?? [] ).filter((group) => group.active));
	const personOptions = toPersonOptions(persons.data ?? []);

	return (
		<>
			<div className="px-1">
				<Controller
					control={ control }
					name="campList"
					render={ ({ field }) => (
						<Toggle
							label="Lista obozowa"
							description="Dodatkowo pilnuje zwrotu umów, a jej opłaty trafiają na konto turniejowe."
							checked={ field.value }
							onChange={ field.onChange }
							disabled={ busy }
						/>
					) }
				/>
			</div>

			<Controller
				control={ control }
				name="populationMode"
				render={ ({ field }) => (
					<ExtendedSelect
						label="Płatności zostaną utworzone na podstawie"
						options={ POPULATION_OPTIONS }
						value={ field.value }
						onChange={ (id) => {
							if (id !== undefined) {
								field.onChange(id);
							}
						} }
						onBlur={ field.onBlur }
						disabled={ busy }
						searchable={ false }
					/>
				) }
			/>

			{ byGroups ? (
				<div className="flex items-center gap-2">
					<Controller
						control={ control }
						name="groupIds"
						render={ ({ field }) => (
							<TagSelect
								multiple
								label="Grupy"
								options={ groupOptions }
								value={ field.value }
								onChange={ field.onChange }
								onBlur={ field.onBlur }
								disabled={ busy || groups.isPending }
								clearable
								error={ errors.groupIds?.message }
								placeholder={ groups.isPending ? 'Wczytywanie grup...' : 'Wybierz grupy' }
							/>
						) }
					/>

					<Tooltip
						content="Każda osoba zapisana obecnie do wybranych grup dostanie jedną pozycję na liście, a skład listy będzie można później uzupełnić o osoby, które dopiszą się do tych grup.">
						<Info aria-label="Informacja o tworzeniu płatności dla grup" className="size-6 text-os-text-muted mt-6.5"/>
					</Tooltip>
				</div>
			) : (
				<div className="flex items-center gap-2">
					<Controller
						control={ control }
						name="personIds"
						render={ ({ field }) => (
							<ExtendedSelect
								multiple
								label="Osoby"
								options={ personOptions }
								value={ field.value }
								onChange={ field.onChange }
								onBlur={ field.onBlur }
								disabled={ busy || persons.isPending }
								clearable
								error={ errors.personIds?.message }
								placeholder={ persons.isPending ? 'Wczytywanie osób...' : 'Wybierz osoby' }
							/>
						) }
					/>

					<Tooltip content="Każda wybrana osoba dostanie jedną pozycję na liście. Nowe osoby będzie można dodać w każdej chwili.">
						<Info aria-label="Informacja o tworzeniu płatności dla osób" className="size-6 text-os-text-muted mt-6.5"/>
					</Tooltip>
				</div>
			) }

			{ groups.isError && byGroups && <Alert tone="warning">Nie można wczytać grup, więc utworzenie listy jest teraz niedostępne.</Alert> }

			{ persons.isError && !byGroups && <Alert tone="warning">Nie można wczytać osób, więc utworzenie listy jest teraz niedostępne.</Alert> }
		</>
	);
}
