import { Controller, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { DatePicker, Input, Textarea } from '@/components/ui/fields';
import { FormSection } from '@/components/ui/fields/FormSection';
import { TagSelect } from '@/components/ui/tags';
import { usePersons } from '@/modules/persons/hooks/usePersons';
import { toPersonOptions } from '@/modules/persons/utils/personOptions';
import { PAYMENT_METHOD_OPTIONS } from '@/types/finance.ts';
import type { DepositFormValues } from '../../schemas/paymentSchemas';


interface DepositFormFieldsProps {
	form: UseFormReturn<DepositFormValues>;
	errors: FieldErrors<DepositFormValues>;
	busy: boolean;
}


export function DepositFormFields({ form, errors, busy }: DepositFormFieldsProps) {
	const persons = usePersons();

	const { register, control } = form;

	const personOptions = toPersonOptions(persons.data ?? []);

	return (
		<>
			<FormSection title="Szczegóły wpłaty" fields={ 1 }>
				<Controller
					control={ control }
					name="personIds"
					render={ ({ field }) => (
						<ExtendedSelect
							multiple
							label="Opłacane osoby"
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
			</FormSection>

			<FormSection>
				<Input
					label="Kwota"
					inputMode="decimal"
					autoComplete="off"
					placeholder="0"
					disabled={ busy }
					error={ errors.amount?.message }
					{ ...register('amount') }
				/>

				<Controller
					control={ control }
					name="paymentMethod"
					render={ ({ field }) => (
						<TagSelect
							label="Forma płatności"
							options={ PAYMENT_METHOD_OPTIONS }
							value={ field.value }
							onChange={ (id) => {
								if (id !== undefined) {
									field.onChange(id);
								}
							} }
							onBlur={ field.onBlur }
							disabled={ busy }
							searchable={ false }
							error={ errors.paymentMethod?.message }
						/>
					) }
				/>
				<Controller
					control={ control }
					name="receivedAt"
					render={ ({ field }) => (
						<DatePicker
							label="Data wpłaty"
							value={ field.value }
							onChange={ field.onChange }
							onBlur={ field.onBlur }
							disabled={ busy }
							error={ errors.receivedAt?.message }
							hint="Decyduje o miesiącu księgowania"
						/>
					) }
				/>
			</FormSection>

			<Textarea
				label="Notatka do wpłaty (opcjonalna)"
				maxLength={ 512 }
				minRows={ 2 }
				disabled={ busy }
				error={ errors.note?.message }
				{ ...register('note') }
			/>

			{ persons.isError && (
				<Alert tone="warning">Wczytywanie listy osób się nie powiodło, więc przyjęcie wpłaty jest teraz niedostępne.</Alert>
			) }
		</>
	);
}
