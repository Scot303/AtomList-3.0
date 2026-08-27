import { Home, Plus } from 'lucide-react';
import { DataTable, TagChipFilters, useTableFilterTags } from '@/components/dataTable';
import { Button } from '@/components/ui/buttons/Button';
import { BirthdayIndicator } from '@/components/shared/BirthdayIndicator';
import { notifyApiError } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { buildGroupOptions, GROUP_TYPE_OPTIONS, indexGroups, } from '@/modules/groups/types/groupRows.ts';
import { ACTIVE_ID } from '@/types/rowTags.ts';
import { useContextMenu } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { usePrefetchFamilies } from './hooks/queries/useFamilies.ts';
import { usePersonRowMenu } from './hooks/contextMenu/usePersonRowMenu.ts';
import { usePersons } from './hooks/queries/usePersons.ts';
import { useUpdatePerson } from './hooks/mutations/usePersonMutations.ts';
import { buildPersonColumns } from './types/personColumns.tsx';
import { type PersonRow, toPersonRow, } from './types/personRows.ts';
import type { UpdatePersonPayload } from './types/types.ts';
import type { ColumnVisibilityState } from "@tanstack/react-table";


/**
 * Identifies this table's saved layout.
 */
const TABLE_KEY = 'persons';

const HIDDEN_COLS: ColumnVisibilityState = {
	groupKinds: false
};

/** The id the kind chips keep their filter under, and the column they filter. */
const KIND_FILTER_ID = 'persons-quick-group-kind';
const KIND_FIELD = 'groupTypes';

const KIND_TITLES = {
	OPEN: 'Pokaż osoby zapisane do grup OPEN',
	TOURNAMENT: 'Pokaż osoby zapisane do grup turniejowych',
};


export function PersonsPage() {
	const { hasPermission } = useAuth();
	const canModify = hasPermission('MODIFY_PERSONS');

	const persons = usePersons();
	const groups = useGroups();

	const prefetchFamilies = usePrefetchFamilies();

	const updatePerson = useUpdatePerson();

	const openModal = useModalStore((state) => state.openModal);
	const openContextMenu = useContextMenu();
	const buildRowMenu = usePersonRowMenu();

	const filterTags = useTableFilterTags(TABLE_KEY);

	const personList = persons.data ?? [];
	const groupList = groups.data ?? [];

	const groupsById = indexGroups(groupList);

	const rows = personList.map((person) => toPersonRow(person, groupsById));
	const columns = buildPersonColumns(buildGroupOptions(groupList));


	const isLoading = persons.isPending || groups.isLoading;

	const handleCellEdit = (rowId: string, columnId: string, value: unknown) => {
		const payload = toUpdatePayload(columnId, value);

		if (payload === null) {
			return;
		}

		updatePerson.mutate(
			{
				id: rowId,
				payload
			},
			{ onError: notifyApiError }
		);
	};

	const prefetchFamiliesModal = () => {
		preloadModal('persons.families');
		prefetchFamilies();
	};

	const prefetchPersonForm = () => {
		preloadModal('persons.form');
		prefetchFamilies();
	};

	const toolbar = (
		<div className="flex items-center">
			<div className="ml-5 mr-10 flex items-center gap-2">
				<TagChipFilters
					tags={ filterTags }
					filterId={ KIND_FILTER_ID }
					field={ KIND_FIELD }
					options={ GROUP_TYPE_OPTIONS }
					titles={ KIND_TITLES }
				/>
			</div>

			{ hasPermission('READ_FAMILIES') && (
				<Button
					size="md"
					variant="secondary"
					className="mr-2 shrink-0 py-1.5"
					leftIcon={ <Home size={ 14 }/> }
					onMouseEnter={ prefetchFamiliesModal }
					onFocus={ prefetchFamiliesModal }
					onClick={ () => void openModal('persons.families') }
				>
					Rodziny
				</Button>
			) }

			{ canModify && (
				<Button
					size="md"
					className="shrink-0 py-1.5"
					leftIcon={ <Plus size={ 14 }/> }
					onMouseEnter={ prefetchPersonForm }
					onFocus={ prefetchPersonForm }
					onClick={ () => void openModal('persons.form') }
				>
					Dodaj
				</Button>
			) }
		</div>
	);

	const toolbarStart = (
		<BirthdayIndicator persons={ personList } className="mr-2 items-center flex"/>
	);

	return (
		<div className="styled-card table-page">
			<DataTable
				moduleKey={ TABLE_KEY }
				data={ rows }
				columns={ columns }
				getRowId={ (row) => row.id }
				isLoading={ isLoading }
				enableGrouping
				emptyMessage="Brak osób do wyświetlenia"
				onCellEdit={ canModify ? handleCellEdit : undefined }
				onRowContextMenu={ (event, row: PersonRow) => openContextMenu(event, buildRowMenu(row)) }
				toolbarStart={ toolbarStart }
				toolbar={ toolbar }
				initialColumnVisibility={ HIDDEN_COLS }
			/>
		</div>
	);
}


/**
 * Null for a column that is not editable, so an unexpected id cannot turn into an empty PATCH.
 */
function toUpdatePayload(columnId: string, value: unknown): UpdatePersonPayload | null {
	switch (columnId) {
		case 'name':
			return { name: String(value ?? '').trim() };

		case 'lastName':
			return { lastName: String(value ?? '').trim() };

		case 'dateOfBirth':
			return value ? { dateOfBirth: String(value) } : null;

		case 'contractSigned':
			return { contractSigned: Boolean(value) };

		case 'activeTag':
			return { active: value === ACTIVE_ID };

		default:
			return null;
	}
}
