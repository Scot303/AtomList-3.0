import { PersonArrearsSection } from '../components/arrears/PersonArrearsSection.tsx';
import { PersonFeesSection } from '../components/fees/PersonFeesSection.tsx';


interface PersonArrearsModalProps {
	personId: string;
	personName: string;
}


/**
 * One person's money, in two halves: what they are billed every month, and what they still owe from months gone by.
 */
export default function PersonArrearsModal({ personId, personName }: PersonArrearsModalProps) {
	return (
		<div className="mt-2 space-y-6">
			<PersonFeesSection personId={ personId }/>

			<PersonArrearsSection personId={ personId } personName={ personName }/>
		</div>
	);
}
