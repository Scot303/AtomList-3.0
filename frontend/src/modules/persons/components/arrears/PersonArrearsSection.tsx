import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { LinePanel, MoneyLine } from '@/components/shared/MoneyLines.tsx';
import { pluralise } from '@/lib/locale';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useModalStore } from '@/stores/modalStore';
import { usePersonArrears } from '../../hooks/queries/usePersonArrears.ts';
import { PersonArrearsTable } from './PersonArrearsTable.tsx';


interface PersonArrearsSectionProps {
	personId: string;
	personName: string;
}


/**
 * Everything this person has not finished paying, whichever month it was billed in.
 */
export function PersonArrearsSection({ personId, personName }: PersonArrearsSectionProps) {
	const { hasPermission } = useAuth();
	const closeModal = useModalStore((state) => state.closeModal);

	const arrears = usePersonArrears(personId);

	return (
		<section className="space-y-4">
			<h3 className="px-1 text-base font-bold tracking-wide text-os-primary uppercase">Zalegające opłaty</h3>

			{ arrears.isPending ? (
				<div className="flex justify-center py-10">
					<Spinner/>
				</div>
			) : arrears.isError ? (
				<Alert tone="danger">{ arrears.error.message }</Alert>
			) : arrears.data.payments.length === 0 ? (
				<Alert tone="success" contentClassName="text-sm">
					{ personName } nie ma żadnych zaległych opłat.
				</Alert>
			) : (
				<div className="space-y-3">
					<p className="px-1 text-sm text-os-text-muted">
						W systemie znaleziono{ ' ' }
						<span className="font-semibold text-os-error">
							{ arrears.data.payments.length } { pluralise(arrears.data.payments.length, 'nieopłaconą pozycję', 'nieopłacone pozycje', 'nieopłaconych pozycji') }
						</span>.
					</p>

					<PersonArrearsTable
						payments={ arrears.data.payments }
						linkLists={ hasPermission('MODIFY_PAYMENTS') }
						onNavigate={ closeModal }
					/>

					<LinePanel className="mt-5">
						<MoneyLine label="Kwota zaległych opłat:" amount={ arrears.data.totalBilled } tone="strong"/>
						<MoneyLine label="Już zapłacono:" amount={ arrears.data.totalSettled } tone="good"/>
						<MoneyLine label="Pozostało do zapłaty:" amount={ arrears.data.totalOutstanding } tone="bad" separated/>
					</LinePanel>
				</div>
			) }
		</section>
	);
}
