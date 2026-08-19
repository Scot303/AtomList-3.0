import { type MouseEvent } from 'react';
import { Info, Percent, Plus, Users } from 'lucide-react';
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
import { useFamilies } from './hooks/useFamilies';
import { usePrefetchMemberships } from './hooks/useMemberships';
import { usePrefetchPersonDiscounts } from './hooks/usePersonDiscounts';
import { usePersons } from './hooks/usePersons';
import { useUpdatePerson } from './hooks/usePersonMutations';
import { buildPersonColumns } from './types/personColumns.tsx';
import { type PersonRow, toPersonRow, } from './types/personRows.ts';
import type { UpdatePersonPayload } from './types/types.ts';
import type { ColumnVisibilityState } from "@tanstack/react-table";


/**
 * Identifies this table's saved layout.
 */
const TABLE_KEY = 'persons';


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

	/* Subscribed to but not read. Keeping data fresh for details modal. */
	useFamilies();

	const prefetchMemberships = usePrefetchMemberships();
	const prefetchDiscounts = usePrefetchPersonDiscounts();
	const updatePerson = useUpdatePerson();

	const openModal = useModalStore((state) => state.openModal);
	const openContextMenu = useContextMenu();

	const filterTags = useTableFilterTags(TABLE_KEY);

	const personList = persons.data ?? [];
	const groupList = groups.data ?? [];

	const groupsById = indexGroups(groupList);

	const rows = personList.map((person) => toPersonRow(person, groupsById));
	const columns = buildPersonColumns(buildGroupOptions(groupList));

	const HIDDEN_COLS: ColumnVisibilityState = {
		groupKinds: false
	};

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

	const handleRowContextMenu = (event: MouseEvent, row: PersonRow) => {
		preloadModal('persons.form');
		preloadModal('persons.discounts');
		preloadModal('persons.groups');

		prefetchMemberships(row.id);
		prefetchDiscounts(row.id);

		openContextMenu(event, [
			{
				id: 'details',
				label: 'Szczegóły',
				icon: Info,
				onSelect: () => void openModal('persons.form', { personId: row.id }),
			},
			{
				id: 'discounts',
				label: 'Zobacz zniżki',
				icon: Percent,
				onSelect: () => void openModal('persons.discounts', {
					personId: row.id,
					personName: row.person.fullName,
				}),
			},
			{
				id: 'groups',
				label: 'Zobacz grupy',
				icon: Users,
				separatorBefore: true,
				onSelect: () => void openModal('persons.groups', {
					personId: row.id,
					personName: row.person.fullName,
				}),
			},
		]);
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

			{ canModify && (
				<Button
					size="md"
					className="shrink-0 py-1.5"
					leftIcon={ <Plus size={ 14 }/> }
					onMouseEnter={ () => preloadModal('persons.form') }
					onFocus={ () => preloadModal('persons.form') }
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
				onRowContextMenu={ handleRowContextMenu }
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
