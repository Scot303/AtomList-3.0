import { Info, Trash2 } from 'lucide-react';
import { notifyApiError, notifySuccess } from '@/lib/toast.ts';
import { useAuth } from '@/modules/auth/hooks/useAuth.ts';
import { useConfirm } from '@/stores/dialogStore.ts';
import type { ContextMenuItem } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry.ts';
import { useModalStore } from '@/stores/modalStore.ts';
import { useDeleteInstructor } from '../useInstructorMutations.ts';
import type { InstructorRow } from '../../types/instructorRows.ts';
import { usePrefetchInstructors } from "@/modules/instructors/hooks/useInstructors.ts";


export type InstructorRowMenuBuilder = (row: InstructorRow) => ContextMenuItem[];


export function useInstructorRowMenu(): InstructorRowMenuBuilder {
	const { hasPermission } = useAuth();

	const openModal = useModalStore((state) => state.openModal);
	const confirm = useConfirm();

	const { mutate: deleteInstructor } = useDeleteInstructor();
	const prefetchInstructors = usePrefetchInstructors();

	const canModify = hasPermission('MODIFY_INSTRUCTORS');


	const requestDelete = async (row: InstructorRow) => {
		const fullName = row.instructor.fullName;

		const confirmed = await confirm({
			title: 'Usunąć tego instruktora?',
			message: `Instruktor „${ fullName }” zniknie z systemu, a wydatki, które go rozliczały, stracą z nim powiązanie. `
				+ 'Na wydatkach pozostanie jedynie nazwa - jeśli nie wskazuje ona jasno na instruktora, historia jego wypłat przestanie być czytelna. \n\n'
				+ 'Żeby tego uniknąć, zalecane jest ustawienie instruktora jako nieaktywnego.',
			confirmText: 'Usuń',
			variant: 'danger',
		});

		if (!confirmed) {
			return;
		}

		deleteInstructor(row.id, {
			onSuccess: () => notifySuccess(`Instruktor ${ fullName } został usunięty.`),
			onError: notifyApiError,
		});
	};


	return (row: InstructorRow) => {
		preloadModal('instructors.form');
		prefetchInstructors();

		return [
			{
				id: 'details',
				label: 'Szczegóły',
				icon: Info,
				onSelect: () => void openModal('instructors.form', {
					instructorId: row.id,
					instructorName: row.instructor.fullName,
				}),
			},
			{
				id: 'delete',
				label: 'Usuń instruktora',
				icon: Trash2,
				danger: true,
				separatorBefore: true,
				disabled: !canModify,
				onSelect: () => void requestDelete(row),
			},
		];
	};
}
