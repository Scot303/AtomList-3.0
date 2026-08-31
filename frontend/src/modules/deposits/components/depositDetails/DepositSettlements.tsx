import { Undo2 } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { TagBadge } from '@/components/ui/tags';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import { notifyApiError, notifySuccess } from '@/lib/toast';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows';
import { describeSheet } from '../../types/sheetLabels';
import { useConfirm } from '@/stores/dialogStore';
import { useRemoveDepositSettlement } from '../../hooks/mutations/useDepositMutations.ts';
import type { DepositSettlementView } from '../../types/types.ts';


interface DepositSettlementsProps {
	depositId: string;
	settlements: DepositSettlementView[];
	canModify: boolean;
}


/**
 * Where one handover's money went, charge by charge.
 */
export function DepositSettlements({ depositId, settlements, canModify }: DepositSettlementsProps) {
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);

	if (settlements.length === 0) {
		return <Alert tone="info">Pieniądze z wpłaty nie zostały jeszcze na nic przeznaczone - do wykorzystania jest pełna kwota.</Alert>;
	}

	return (
		<ul className="space-y-2">
			{ settlements.map((settlement) => (
				<SettlementRow
					key={ settlement.id }
					depositId={ depositId }
					settlement={ settlement }
					groupsById={ groupsById }
					canModify={ canModify }
				/>
			)) }
		</ul>
	);
}


interface SettlementRowProps {
	depositId: string;
	settlement: DepositSettlementView;
	groupsById: ReturnType<typeof indexGroups>;
	canModify: boolean;
}


function SettlementRow({ depositId, settlement, groupsById, canModify }: SettlementRowProps) {
	const confirm = useConfirm();
	const remove = useRemoveDepositSettlement();

	const clearance = !settlement.carryingMoney;
	const sheet = describeSheet(settlement.year, settlement.month, settlement.tournamentList, settlement.listName);
	const group = settlement.groupId === null ? undefined : groupsById.get(settlement.groupId);

	const handleRemove = async () => {
		const confirmed = await confirm({
			title: 'Wycofać to rozliczenie?',
			message: `${ formatCurrency(settlement.amount) } wróci jako nadpłata na tej wpłacie, a pozycja `
				+ `${ settlement.paymentCode } znów będzie do opłacenia przez ${ settlement.personName }.`,
			confirmText: 'Wycofaj',
			variant: 'warning',
		});

		if (!confirmed) {
			return;
		}

		remove.mutate(
			{ depositId, settlementId: settlement.id },
			{
				onSuccess: () => notifySuccess('Rozliczenie zostało wycofane.'),
				onError: notifyApiError,
			},
		);
	};

	return (
		<li className={ cn('styled-card flex items-center gap-3 rounded-xl px-3.5 py-2.5', remove.isPending && 'opacity-60') }>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-os-text-muted">
					<span className="text-os-primary font-bold">{ settlement.paymentCode }</span>
					<span aria-hidden>·</span>
					<span>Lista: <span className="text-os-text">{ sheet }</span></span>

					{ clearance && (
						<>
							<span aria-hidden>·</span>
							<Tooltip
								content="Te pieniądze są przychodem miesiąca, w którym wpłynęły - na wskazanej liście tylko zamykają dług."
								focusable={ false }
							>
								<TagBadge label="zamknięcie długu" color="amber" size="sm"/>
							</Tooltip>
						</>
					) }
				</div>

				<div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-os-text-muted">
					<span className="text-os-text-muted">Kwota: <span className="font-medium tabular-nums text-os-text">{ formatCurrency(settlement.amount) }</span></span>
					<span aria-hidden>·</span>
					<span>Opłacone dnia: <span className="text-os-text">{ formatInstantDate(settlement.settledAt) }</span></span>
				</div>

				<div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-os-text-muted">
					<span className="truncate">{ settlement.personName }</span>
					{ group === undefined
						? settlement.description !== null && settlement.description !== '' && <>
                        <span aria-hidden>·</span>
                        <span className="truncate text-sm">{ settlement.description }</span>
                    </>
						: <>
							<span aria-hidden>·</span>
							<TagBadge label={ group.name } color={ resolveGroupColor(group) } size="sm"/>
						</> }
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
