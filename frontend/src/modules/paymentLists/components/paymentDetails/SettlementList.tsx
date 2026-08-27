import { Undo2 } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { formatInstantDate, formatInstantMonth } from '@/utils/dateUtils.ts';
import { TagBadge, TagBadgeSingle } from '@/components/ui/tags';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import { notifyApiError, notifySuccess } from '@/lib/toast';
import { useConfirm } from '@/stores/dialogStore';
import { useRemoveDepositSettlement } from '@/modules/deposits/hooks/mutations/useDepositMutations.ts';
import { PAYMENT_METHOD_OPTIONS } from '@/types/finance.ts';
import type { SettlementView } from '../../types/types.ts';


interface SettlementListProps {
	settlements: SettlementView[];
	/** Who this money was for, so a confirmation can name them. */
	personName: string;
	canModify: boolean;
}


export function SettlementList({ settlements, personName, canModify }: SettlementListProps) {
	if (settlements.length === 0) {
		return <Alert tone="info">Nic nie zostało jeszcze wpłacone na tą pozycję.</Alert>;
	}

	return (
		<ul className="space-y-2">
			{ settlements.map((settlement) => (
				<SettlementRow
					key={ settlement.id }
					settlement={ settlement }
					personName={ personName }
					canModify={ canModify }
				/>
			)) }
		</ul>
	);
}


function SettlementRow({ settlement, personName, canModify }: { settlement: SettlementView; personName: string; canModify: boolean }) {
	const confirm = useConfirm();
	const remove = useRemoveDepositSettlement();

	const clearance = !settlement.carryingMoney;
	const reportedIn = formatInstantMonth(settlement.depositReceivedAt);

	const handleRemove = async () => {
		const confirmed = await confirm({
			title: 'Wycofać to rozliczenie?',
			message: `Kwota ${ formatCurrency(settlement.amount) } wróci jako wolne środki na wpłacie o numerze ${ settlement.depositCode } do wykorzystania przez - ${ personName }.`,
			confirmText: 'Wycofaj',
			variant: 'warning',
		});

		if (!confirmed) {
			return;
		}

		remove.mutate(
			{ depositId: settlement.depositId, settlementId: settlement.id },
			{
				onSuccess: () => notifySuccess('Rozliczenie zostało wycofane.'),
				onError: notifyApiError,
			},
		);
	};

	return (
		<li className={ cn('styled-card flex items-center rounded-xl px-3.5 py-2.5', remove.isPending && 'opacity-60') }>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="text-sm font-bold tabular-nums text-os-text">{ formatCurrency(settlement.amount) }</span>
					{ settlement.paymentMethod !== null && <TagBadgeSingle id={ settlement.paymentMethod } options={ PAYMENT_METHOD_OPTIONS } size="sm"/> }
					<span className="truncate text-xs text-os-text-muted">

						{ ' · ' }
						{ formatInstantDate(settlement.settledAt) }
					</span>
				</div>

				<div className="mt-1 flex min-h-5 flex-wrap items-center gap-x-2 text-xs text-os-text-muted">
					<span>Wpłata: { settlement.depositCode }</span>
					<span aria-hidden>·</span>
					<span>{ settlement.code }</span>

					{ clearance && (
						<Tooltip
							content={ `Te pieniądze są przychodem z ${ reportedIn === '' ? 'innego okresu' : reportedIn.toLowerCase() }, a tutaj tylko zamykają dług.` }
							focusable={ false }
						>
							<TagBadge label="zamknięcie długu" color="amber" size="sm"/>
						</Tooltip>
					) }
				</div>
			</div>

			{ canModify && (
				<Button
					type="button"
					variant="ghost"
					size="md"
					isLoading={ remove.isPending }
					onClick={ () => void handleRemove() }
					leftIcon={ <Undo2 size={ 14 }/> }
					title="Wycofaj to rozliczenie"
				>
					Wycofaj
				</Button>
			) }
		</li>
	);
}
