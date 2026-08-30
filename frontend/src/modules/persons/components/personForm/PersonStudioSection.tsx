import { type Control, Controller, useFormState } from 'react-hook-form';
import { ExtendedSelect, type ExtendedSelectOption } from '@/components/ui/extendedSelect';
import { DatePicker, FormSection } from '@/components/ui/fields';
import { TagSelect } from '@/components/ui/tags';
import { ACTIVE_ID, ACTIVE_TAG_OPTIONS, toActiveTag } from '@/types/rowTags.ts';
import { STUDENT_DISCOUNT_PERCENT } from '../../types/discountConstants.ts';
import type { PersonFormValues } from '../../schemas/personSchemas';


const YES_ID = 'yes';
const NO_ID = 'no';

const CONTRACT_OPTIONS: ExtendedSelectOption[] = [
	{ id: YES_ID, name: 'Tak', hint: 'oddana do studia' },
	{ id: NO_ID, name: 'Nie' },
];

const STUDENT_OPTIONS: ExtendedSelectOption[] = [
	{ id: YES_ID, name: 'Tak', hint: `dodatkowe -${ STUDENT_DISCOUNT_PERCENT }%` },
	{ id: NO_ID, name: 'Nie' },
];


interface PersonStudioSectionProps {
	control: Control<PersonFormValues>;
	busy: boolean;
	showActive: boolean;
}


/**
 * The person's standing with the studio.
 */
export const PersonStudioSection = ({ control, busy, showActive }: PersonStudioSectionProps) => {
	const { errors } = useFormState({ control });

	return (
		<FormSection title="Studio">
			<Controller
				control={ control }
				name="joinedStudioAt"
				render={ ({ field }) => (
					<DatePicker
						label="Data dołączenia"
						value={ field.value }
						onChange={ field.onChange }
						onBlur={ field.onBlur }
						disabled={ busy }
						error={ errors.joinedStudioAt?.message }
					/>
				) }
			/>

			<Controller
				control={ control }
				name="joinedClubDate"
				render={ ({ field }) => (
					<DatePicker
						label="Data dołączenia do klubu"
						value={ field.value }
						onChange={ field.onChange }
						onBlur={ field.onBlur }
						disabled={ busy }
						error={ errors.joinedClubDate?.message }
					/>
				) }
			/>

			<Controller
				control={ control }
				name="leftClubDate"
				render={ ({ field }) => (
					<DatePicker
						label="Data odejścia z klubu"
						value={ field.value }
						onChange={ field.onChange }
						onBlur={ field.onBlur }
						disabled={ busy }
						error={ errors.leftClubDate?.message }
					/>
				) }
			/>

			<Controller
				control={ control }
				name="contractSigned"
				render={ ({ field }) => (
					<ExtendedSelect
						label="Umowa podpisana"
						options={ CONTRACT_OPTIONS }
						value={ toYesNo(field.value) }
						onChange={ (id) => {
							if (id !== undefined) {
								field.onChange(id === YES_ID);
							}
						} }
						onBlur={ field.onBlur }
						disabled={ busy }
						searchable={ false }
						error={ errors.contractSigned?.message }
					/>
				) }
			/>

			<Controller
				control={ control }
				name="studentDiscount"
				render={ ({ field }) => (
					<ExtendedSelect
						label="Zniżka studencka"
						options={ STUDENT_OPTIONS }
						value={ toYesNo(field.value) }
						onChange={ (id) => {
							if (id !== undefined) {
								field.onChange(id === YES_ID);
							}
						} }
						onBlur={ field.onBlur }
						disabled={ busy }
						searchable={ false }
						error={ errors.studentDiscount?.message }
					/>
				) }
			/>

			{ showActive && (
				<Controller
					control={ control }
					name="active"
					render={ ({ field }) => (
						<TagSelect
							label="Status osoby"
							options={ ACTIVE_TAG_OPTIONS }
							searchable={ false }
							value={ toActiveTag(field.value) }
							onChange={ (value) => {
								if (value !== undefined) {
									field.onChange(value === ACTIVE_ID);
								}
							} }
							onBlur={ field.onBlur }
							disabled={ busy }
							error={ errors.active?.message }
						/>
					) }
				/>
			) }
		</FormSection>
	);
};


function toYesNo(value: boolean): string {
	return value ? YES_ID : NO_ID;
}
