import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { TagBadgeSingle } from '@/components/ui/tags';
import { fieldMessageReserve, Input } from '@/components/ui/fields';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { formatCurrency } from '@/lib/locale';
import { coveredPersonsNames, coveredPersonsSummary, PAYMENT_METHOD_OPTIONS } from '@/types/finance.ts';
import { useModalStore } from '@/stores/modalStore';
import { useDepositByCode } from '../hooks/useDeposits';
import { SCOPE_OPTIONS } from '../types/depositRows.ts';
import { type DepositCodeFormValues, depositCodeSchema } from '../schemas/depositSchemas';
import { cn } from "@/lib/cn.ts";


export default function FindDepositModal() {
	const openModal = useModalStore((state) => state.openModal);
	const closeModal = useModalStore((state) => state.closeModal);

	const [code, setCode] = useState('');

	const found = useDepositByCode(code);

	const { register, handleSubmit, formState: { errors } } = useForm<DepositCodeFormValues>({
		resolver: zodResolver(depositCodeSchema),
		mode: "onTouched",
		defaultValues: { code: '' },
	});

	const onSubmit = handleSubmit((values) => setCode(values.code));

	const deposit = found.data;

	return (
		<div className="mt-2 space-y-5">
			<form onSubmit={ onSubmit } noValidate className={ cn("space-y-5", fieldMessageReserve) }>
				<Input
					label="Numer wpłaty"
					autoComplete="off"
					autoFocus
					placeholder="np. W-1234"
					error={ errors.code?.message }
					{ ...register('code') }
				/>

				<div className="flex justify-end gap-3 pt-1">
					<Button type="button" variant="secondary_muted" size="md" onClick={ closeModal }>
						Anuluj
					</Button>

					<Button type="submit" size="md" isLoading={ found.isFetching } leftIcon={ <Search size={ 16 }/> }>
						Znajdź
					</Button>
				</div>
			</form>

			{ found.isFetching && (
				<div className="flex justify-center py-2">
					<Spinner/>
				</div>
			) }

			{ !found.isFetching && found.isError && (
				<Alert tone="warning" contentClassName="text-sm">
					{ found.error.status === 404 ? 'Nie ma wpłaty o takim numerze.' : found.error.message }
				</Alert>
			) }

			{ !found.isFetching && deposit !== undefined && (
				<section className="styled-card space-y-2 rounded-2xl px-4 py-3">
					<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
						<span className="text-sm font-semibold text-os-text" title={ coveredPersonsNames(deposit.coveredPersons) }>
							{ coveredPersonsSummary(deposit.coveredPersons) }
						</span>

						<span className="text-sm font-medium tabular-nums text-os-text">
							{ formatCurrency(deposit.totalAmount) }
						</span>
					</div>

					<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-os-text-muted">
						<span>{ formatInstantDate(deposit.receivedAt) }</span>
						<span aria-hidden>·</span>
						<TagBadgeSingle id={ deposit.paymentMethod } options={ PAYMENT_METHOD_OPTIONS } size="sm"/>
						<span aria-hidden>·</span>
						<TagBadgeSingle id={ deposit.scope } options={ SCOPE_OPTIONS } size="sm"/>
					</div>

					<div className="flex items-center justify-between gap-3 pt-1">
						{ deposit.unallocatedAmount > 0 && (
							<p className="text-sm text-os-green">
								Wolne środki: { formatCurrency(deposit.unallocatedAmount) }
							</p>
						) }

						<Button
							type="button"
							size="sm"
							className="ml-auto"
							leftIcon={ <ArrowRight size={ 16 }/> }
							onClick={ () => void openModal('deposits.details', { depositId: deposit.id, depositCode: deposit.code }) }
						>
							Otwórz szczegóły
						</Button>
					</div>
				</section>
			) }
		</div>
	);
}
