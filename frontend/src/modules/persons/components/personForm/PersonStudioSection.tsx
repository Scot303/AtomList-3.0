import { type Control, Controller, useFormState } from 'react-hook-form';
import { DatePicker, FormSection, Toggle } from '@/components/ui/fields';
import type { PersonFormValues } from '../../schemas/personSchemas';
import { cn } from "@/lib/cn.ts";


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

			<div className={ cn(
				'flex flex-col justify-center sm:col-span-2 styled-card px-3 py-1 rounded-xl',
				!showActive && 'mt-3'
			) }>
				<Controller
					control={ control }
					name="contractSigned"
					render={ ({ field }) => (
						<Toggle
							label="Umowa podpisana"
							description="Osoba oddała podpisaną umowę do studia."
							checked={ field.value }
							onChange={ field.onChange }
							disabled={ busy }
							compact
						/>
					) }
				/>

				{ showActive && (
					<Controller
						control={ control }
						name="active"
						render={ ({ field }) => (
							<Toggle
								label="Aktywna"
								description="Nieaktywne osoby nie trafiają na nowe listy płatności."
								checked={ field.value }
								onChange={ field.onChange }
								disabled={ busy }
								compact
							/>
						) }
					/>
				) }
			</div>
		</FormSection>
	);
};
