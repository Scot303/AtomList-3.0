import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { PersonForm } from '../components/personForm/PersonForm';
import { usePersons } from '../hooks/queries/usePersons.ts';


interface PersonFormModalProps {
	/** The person to edit. Leave it out to fill in a new one. */
	personId?: string;
}


/**
 * Everything held about one person.
 */
export default function PersonFormModal({ personId }: PersonFormModalProps) {
	if (personId === undefined) {
		return <PersonForm/>;
	}

	return <EditPersonForm personId={ personId }/>;
}


function EditPersonForm({ personId }: { personId: string }) {
	const persons = usePersons();
	const person = persons.data?.find((candidate) => candidate.id === personId);

	if (persons.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (person === undefined) {
		return <Alert tone="warning">Nie znaleziono tej osoby. Mogła zostać usunięta.</Alert>;
	}

	return <PersonForm key={ person.id } person={ person }/>;
}
