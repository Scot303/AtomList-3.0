import { Plus } from 'lucide-react';
import { DataTable, TagChipFilters, useTableFilterTags } from '@/components/dataTable';
import { Button } from '@/components/ui/buttons/Button';
import { notifyApiError } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useContextMenu } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { ACTIVE_ID } from '@/types/rowTags.ts';
import { useInstructorRowMenu } from './hooks/contextMenu/useInstructorRowMenu.ts';
import { useInstructors } from './hooks/useInstructors.ts';
import { useUpdateInstructor } from './hooks/useInstructorMutations.ts';
import { buildInstructorColumns } from './types/instructorColumns.tsx';
import { CONTRACT_TYPE_OPTIONS, type InstructorRow, toInstructorRow } from './types/instructorRows.ts';
import type { UpdateInstructorPayload } from './types/types.ts';


const TABLE_KEY = 'instructors';


const KIND_FILTER_ID = 'instructors-quick-contract-kind';
const KIND_FIELD = 'contractType';

const KIND_TITLES = {
	OPEN: 'Pokaż instruktorów na umowie OPEN',
	TOURNAMENT: 'Pokaż instruktorów na umowie turniejowej',
};


export function InstructorsPage() {
	const { hasPermission } = useAuth();
	const canModify = hasPermission('MODIFY_INSTRUCTORS');

	const instructors = useInstructors();
	const updateInstructor = useUpdateInstructor();

	const openModal = useModalStore((state) => state.openModal);
	const openContextMenu = useContextMenu();
	const buildRowMenu = useInstructorRowMenu();

	const filterTags = useTableFilterTags(TABLE_KEY);

	const rows = ( instructors.data ?? [] ).map(toInstructorRow);
	const columns = buildInstructorColumns(canModify);

	const handleCellEdit = (rowId: string, columnId: string, value: unknown) => {
		const payload = toUpdatePayload(columnId, value);

		if (payload === null) {
			return;
		}

		updateInstructor.mutate(
			{
				id: rowId,
				payload
			},
			{ onError: notifyApiError }
		);
	};

	const toolbar = (
		<div className="flex items-center">
			<div className="ml-5 mr-10 flex items-center gap-2">
				<TagChipFilters
					tags={ filterTags }
					filterId={ KIND_FILTER_ID }
					field={ KIND_FIELD }
					options={ CONTRACT_TYPE_OPTIONS }
					titles={ KIND_TITLES }
				/>
			</div>

			{ canModify && (
				<Button
					size="md"
					className="shrink-0 py-1.5"
					leftIcon={ <Plus size={ 14 }/> }
					onMouseEnter={ () => preloadModal('instructors.form') }
					onFocus={ () => preloadModal('instructors.form') }
					onClick={ () => void openModal('instructors.form') }
				>
					Dodaj
				</Button>
			) }
		</div>
	);

	return (
		<div className="styled-card table-page">
			<DataTable
				moduleKey={ TABLE_KEY }
				data={ rows }
				columns={ columns }
				getRowId={ (row) => row.id }
				isLoading={ instructors.isLoading }
				enableGrouping
				emptyMessage="Brak instruktorów do wyświetlenia"
				onCellEdit={ canModify ? handleCellEdit : undefined }
				onRowContextMenu={ (event, row: InstructorRow) => openContextMenu(event, buildRowMenu(row)) }
				toolbar={ toolbar }
			/>
		</div>
	);
}


function toUpdatePayload(columnId: string, value: unknown): UpdateInstructorPayload | null {
	switch (columnId) {
		case 'name':
			return { name: String(value ?? '').trim() };

		case 'lastName':
			return { lastName: String(value ?? '').trim() };

		case 'costPerHour': {
			if (value === null || value === '') {
				return null;
			}

			const rate = Number(value);

			return Number.isNaN(rate) || rate < 0 ? null : { costPerHour: rate };
		}

		case 'contractNumber':
			return { contractNumber: String(value ?? '').trim() };

		case 'contractSignedDate':
			return value ? { contractSignedDate: String(value) } : null;

		case 'contractType':
			return value === 'OPEN' || value === 'TOURNAMENT' ? { contractType: value } : null;

		case 'activeTag':
			return { active: value === ACTIVE_ID };

		default:
			return null;
	}
}
