import { type Control, Controller, useFormState, useWatch } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { DatePicker, Input, Textarea } from '@/components/ui/fields';
import { formatCurrency } from '@/lib/locale';
import { parseAmount, type TransactionFormValues } from '../schemas/transactionSchemas.ts';


interface TransactionFormFieldsProps {
	control: Control<TransactionFormValues>;
	disabled: boolean;
}


export function TransactionFormFields({ control, disabled }: TransactionFormFieldsProps) {
	const { errors } = useFormState({ control });

	const [typedAmount, typedQuantity] = useWatch({ control, name: ['amount', 'quantity'] });

	const amount = parseAmount(typedAmount);
	const quantity = parseAmount(typedQuantity);
	const total = Number.isNaN(amount) || Number.isNaN(quantity) ? null : amount * quantity;

	return (
		<>
			<Controller
				control={ control }
				name="name"
				render={ ({ field }) => (
					<Input
						label="Nazwa"
						autoComplete="off"
						maxLength={ 1024 }
						placeholder="np. Wynajem sali"
						disabled={ disabled }
						error={ errors.name?.message }
						{ ...field }
					/>
				) }
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Controller
					control={ control }
					name="amount"
					render={ ({ field }) => (
						<Input
							label="Kwota"
							inputMode="decimal"
							autoComplete="off"
							placeholder="0"
							disabled={ disabled }
							error={ errors.amount?.message }
							{ ...field }
						/>
					) }
				/>

				<Controller
					control={ control }
					name="quantity"
					render={ ({ field }) => (
						<Input
							label="Ilość"
							inputMode="decimal"
							autoComplete="off"
							placeholder="1"
							disabled={ disabled }
							error={ errors.quantity?.message }
							{ ...field }
						/>
					) }
				/>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Controller
					control={ control }
					name="paymentDate"
					render={ ({ field }) => (
						<DatePicker
							label="Data płatności"
							value={ field.value }
							onChange={ field.onChange }
							onBlur={ field.onBlur }
							disabled={ disabled }
							error={ errors.paymentDate?.message }
						/>
					) }
				/>

				<Controller
					control={ control }
					name="invoiceNumber"
					render={ ({ field }) => (
						<Input
							label="Nr faktury"
							autoComplete="off"
							maxLength={ 64 }
							placeholder="np. FV 12/2026"
							disabled={ disabled }
							error={ errors.invoiceNumber?.message }
							{ ...field }
						/>
					) }
				/>
			</div>

			<Controller
				control={ control }
				name="note"
				render={ ({ field }) => (
					<Textarea
						label="Notatka"
						maxLength={ 512 }
						minRows={ 2 }
						maxRows={ 6 }
						autoResize
						disabled={ disabled }
						error={ errors.note?.message }
						{ ...field }
					/>
				) }
			/>

			{ total !== null && total > 0 && (
				<Alert tone="info">Razem: <strong>{ formatCurrency(total) }</strong></Alert>
			) }
		</>
	);
}
