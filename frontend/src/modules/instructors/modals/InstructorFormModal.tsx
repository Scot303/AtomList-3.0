import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { InstructorForm } from '../components/instructorForm/InstructorForm.tsx';
import { useInstructors } from '../hooks/useInstructors.ts';


interface InstructorFormModalProps {
	instructorId?: string;
	instructorName?: string;
}


export default function InstructorFormModal({ instructorId }: InstructorFormModalProps) {
	if (instructorId === undefined) {
		return <InstructorForm/>;
	}

	return <EditInstructorForm instructorId={ instructorId }/>;
}


function EditInstructorForm({ instructorId }: { instructorId: string }) {
	const instructors = useInstructors();
	const instructor = instructors.data?.find((candidate) => candidate.id === instructorId);

	if (instructors.isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner/>
			</div>
		);
	}

	if (instructor === undefined) {
		return <Alert tone="warning" contentClassName="text-sm">Nie znaleziono tego instruktora. Mógł on zostać usunięty.</Alert>;
	}

	return <InstructorForm key={ instructor.id } instructor={ instructor }/>;
}
