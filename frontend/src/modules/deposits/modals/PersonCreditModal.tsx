import { Eye, Wallet } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { TagBadgeSingle } from '@/components/ui/tags';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { formatCurrency, pluralise } from '@/lib/locale';
import { LinePanel, MoneyLine } from '@/components/shared/MoneyLines.tsx';
import { PAYMENT_METHOD_OPTIONS } from '@/types/finance.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useModalStore } from '@/stores/modalStore';
import { usePersonCredit } from '../hooks/usePersonCredit';
import { SCOPE_OPTIONS } from '../types/depositRows.ts';
import type { DepositView } from '../types/types.ts';


interface PersonCreditModalProps {
	personId: string;
	personName: string;
}


export default function PersonCreditModal({ personId, personName }: PersonCreditModalProps) {
	const credit = usePersonCredit(personId);

	if (credit.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (credit.isError) {
		return <Alert tone="danger">{ credit.error.message }</Alert>;
	}

	const deposits = credit.data.filter((deposit) => deposit.unallocatedAmount > 0);

	if (deposits.length === 0) {
		return (
			<Alert tone="info" contentClassName="text-sm">
				{ personName } nie ma obecnie żadnej nadpłaty.
			</Alert>
		);
	}

	const total = deposits.reduce((sum, deposit) => sum + deposit.unallocatedAmount, 0);

	return (
		<div className="mt-2 space-y-5">
			<p className="text-base text-os-text-muted px-1">
				W systemie znaleziono{ ' ' }
				<span className="text-os-primary font-semibold">
					{ deposits.length } { pluralise(deposits.length, 'wpłatę', 'wpłaty', 'wpłat') }
				</span>, na{ ' ' }
				{ pluralise(deposits.length, 'której', 'których', 'których') } zostały jeszcze wolne środki.
			</p>

			<section className="space-y-3">
				{ deposits.map((deposit) => <CreditRow key={ deposit.id } deposit={ deposit }/>) }
			</section>

			<LinePanel>
				<MoneyLine label="Łączna kwota dostępnych środków:" amount={ total } tone="good"/>
			</LinePanel>
		</div>
	);
}


function CreditRow({ deposit }: { deposit: DepositView }) {
	const { hasPermission } = useAuth();
	const openModal = useModalStore((state) => state.openModal);

	return (
		<article className="styled-card space-y-2 rounded-2xl px-4 py-3">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-os-text-muted">
				<span className="font-semibold text-os-text">{ deposit.code }</span>
				<span aria-hidden>·</span>
				<TagBadgeSingle id={ deposit.paymentMethod } options={ PAYMENT_METHOD_OPTIONS } size="sm"/>
				<span aria-hidden>·</span>
				<span>{ formatInstantDate(deposit.receivedAt) }</span>
				<span aria-hidden>·</span>
				<TagBadgeSingle id={ deposit.scope } options={ SCOPE_OPTIONS } size="sm"/>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-2 pt-1">
				<span className="text-sm tabular-nums text-os-text-muted">
					Wolne środki:{ ' ' }
					<span className="font-medium text-os-green">{ formatCurrency(deposit.unallocatedAmount) }</span>
					<span className="ml-2">z { formatCurrency(deposit.totalAmount) }</span>
				</span>

				<div className="flex flex-wrap justify-end gap-2">
					<Button
						type="button"
						variant="secondary_muted"
						size="sm"
						leftIcon={ <Eye size={ 14 }/> }
						onClick={ () => void openModal('deposits.details', { depositId: deposit.id, depositCode: deposit.code }) }
					>
						Szczegóły
					</Button>

					{ hasPermission('MODIFY_PAYMENTS') && (
						<Button
							type="button"
							size="sm"
							leftIcon={ <Wallet size={ 14 }/> }
							onClick={ () => void openModal('deposits.allocate', { deposit }) }
						>
							Rozlicz
						</Button>
					) }
				</div>
			</div>
		</article>
	);
}
