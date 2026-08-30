import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { LinePanel, MoneyLine } from '@/components/shared/MoneyLines.tsx';
import { pluralise } from '@/lib/locale';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useModalStore } from '@/stores/modalStore';
import { PersonArrearsTable } from '../components/arrears/PersonArrearsTable.tsx';
import { usePersonArrears } from '../hooks/queries/usePersonArrears.ts';


interface PersonArrearsModalProps {
	personId: string;
	personName: string;
}


export default function PersonArrearsModal({ personId, personName }: PersonArrearsModalProps) {
	const { hasPermission } = useAuth();
	const closeModal = useModalStore((state) => state.closeModal);

	const arrears = usePersonArrears(personId);

	if (arrears.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (arrears.isError) {
		return <Alert tone="danger">{ arrears.error.message }</Alert>;
	}

	const { payments, totalBilled, totalSettled, totalOutstanding } = arrears.data;

	if (payments.length === 0) {
		return (
			<Alert tone="success" contentClassName="text-sm">
				{ personName } nie ma żadnych zaległych opłat.
			</Alert>
		);
	}

	return (
		<div className="mt-2 space-y-5">
			<p className="px-1 text-base text-os-text-muted">
				W systemie znaleziono{ ' ' }
				<span className="font-semibold text-os-primary">
					{ payments.length } { pluralise(payments.length, 'nieopłaconą pozycję', 'nieopłacone pozycje', 'nieopłaconych pozycji') }
				</span>.
			</p>

			<PersonArrearsTable
				payments={ payments }
				linkLists={ hasPermission('MODIFY_PAYMENTS') }
				onNavigate={ closeModal }
			/>

			<LinePanel className="mt-8">
				<MoneyLine label="Kwota zaległych opłat:" amount={ totalBilled } tone="strong"/>
				<MoneyLine label="Już zapłacono:" amount={ totalSettled } tone="good"/>
				<MoneyLine label="Pozostało do zapłaty:" amount={ totalOutstanding } tone="bad" separated/>
			</LinePanel>
		</div>
	);
}
