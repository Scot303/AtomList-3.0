import { Trash2, Wallet } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { formatInstantDate } from '@/utils/dateUtils.ts';
import { TagBadgeOf } from '@/components/ui/tags';
import { formatCurrency, pluralise } from '@/lib/locale';
import { notifyApiError, notifySuccess } from '@/lib/toast';
import { LinePanel, MoneyLine, TextLine } from '@/components/shared/MoneyLines.tsx';
import { coveredPersonsNames, PAYMENT_METHOD_TAGS } from '@/types/finance.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useConfirm } from '@/stores/dialogStore';
import { useModalStore } from '@/stores/modalStore';
import { CoveredPersons } from '../components/depositDetails/CoveredPersons';
import { DepositSettlements } from '../components/depositDetails/DepositSettlements';
import { useDeposit } from '../hooks/queries/useDeposits.ts';
import { useDeleteDeposit } from '../hooks/mutations/useDepositMutations.ts';
import { ORIGIN_TAGS, SCOPE_TAGS } from '../types/depositRows';
import type { DepositView } from '../types/types.ts';


interface DepositDetailsModalProps {
	depositId: string;
	depositCode: string;
}


export default function DepositDetailsModal({ depositId }: DepositDetailsModalProps) {
	const deposit = useDeposit(depositId);

	if (deposit.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (deposit.isError) {
		return <Alert tone="danger">{ deposit.error.message }</Alert>;
	}

	return <Details deposit={ deposit.data }/>;
}


function Details({ deposit }: { deposit: DepositView }) {
	const { hasPermission } = useAuth();
	const canModify = hasPermission('MODIFY_PAYMENTS');

	const openModal = useModalStore((state) => state.openModal);
	const closeModal = useModalStore((state) => state.closeModal);
	const confirm = useConfirm();

	const remove = useDeleteDeposit();

	const settlements = deposit.settlements ?? [];
	const hasCredit = deposit.unallocatedAmount > 0;

	const coveredNames = coveredPersonsNames(deposit.coveredPersons);

	const handleDelete = async () => {
		const confirmed = await confirm({
			title: 'Usunąć tę wpłatę?',
			message: `Wpłata ${ deposit.code } na ${ formatCurrency(deposit.totalAmount) } za ${ coveredNames } zniknie z systemu. \n\n`
				+ 'Zaleca się wykonanie tej operacji tylko w przypadku, gdy wpłata została zapisana omyłkowo.',
			confirmText: 'Usuń',
			variant: 'danger',
		});

		if (!confirmed) {
			return;
		}

		remove.mutate(deposit.id, {
			onSuccess: () => {
				notifySuccess(`Wpłata ${ deposit.code } została usunięta.`);
				closeModal();
			},
			onError: notifyApiError,
		});
	};

	return (
		<div className="mt-2 space-y-5">
			<CoveredPersons persons={ deposit.coveredPersons }/>

			<LinePanel title="Pieniądze">
				<MoneyLine label="Przyjęta kwota:" amount={ deposit.totalAmount } tone="strong"/>
				<MoneyLine
					label="Rozliczona kwota:"
					amount={ deposit.allocatedAmount }
					tone="good"
					suffix={
						settlements.length === 0 ? undefined : (
							<span className="ml-1 text-os-text-muted">
								({ settlements.length } { pluralise(settlements.length, 'pozycja', 'pozycje', 'pozycji') })
							</span>
						)
					}
				/>
				<MoneyLine
					label="Pozostałe wolne środki:"
					amount={ deposit.unallocatedAmount }
					tone={ hasCredit ? 'bad' : 'muted' }
					separated
				/>
			</LinePanel>

			<LinePanel title="Informacje o wpłacie">
				<TextLine label="Data wpłaty:">{ formatInstantDate(deposit.receivedAt) }</TextLine>
				<TextLine label="Forma płatności:">
					<TagBadgeOf tag={ PAYMENT_METHOD_TAGS[deposit.paymentMethod] }/>
				</TextLine>
				<TextLine label="Zakres wpłaty:">
					<TagBadgeOf tag={ SCOPE_TAGS[deposit.scope] }/>
				</TextLine>
				<TextLine label="Sposób dodania do systemu:">
					<TagBadgeOf tag={ ORIGIN_TAGS[deposit.origin] }/>
				</TextLine>
			</LinePanel>

			{ deposit.note !== null && deposit.note !== '' && (
				<section className="space-y-1">
					<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Notatka</h3>
					<p className="text-sm whitespace-pre-wrap text-os-text">{ deposit.note }</p>
				</section>
			) }

			<section className="space-y-2">
				<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Wpłata została rozliczona na</h3>

				<DepositSettlements depositId={ deposit.id } settlements={ settlements } canModify={ canModify }/>
			</section>


			<div className="flex flex-wrap justify-end gap-3 pt-1">
				{ canModify && deposit.allocatedAmount <= 0 && (
					<Button
						type="button"
						variant="danger"
						size="md"
						isLoading={ remove.isPending }
						leftIcon={ <Trash2 size={ 16 }/> }
						onClick={ () => void handleDelete() }
					>
						Usuń wpłatę
					</Button>
				) }

				{ canModify && hasCredit && (
					<Button
						type="button"
						size="md"
						leftIcon={ <Wallet size={ 16 }/> }
						onClick={ () => void openModal('deposits.allocate', { deposit }) }
					>
						Rozlicz nadpłatę
					</Button>
				) }
			</div>
		</div>
	);
}
