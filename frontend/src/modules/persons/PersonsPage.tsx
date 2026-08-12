import { type MouseEvent, useCallback, useMemo } from 'react';
import { Info, Percent, Plus, Users } from 'lucide-react';
import { DataTable, useTableFilterTags } from '@/components/dataTable';
import { Button } from '@/components/ui/buttons/Button';
import { notifyApiError } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useContextMenu } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { QuickGroupFilters } from './components/QuickGroupFilters';
import { useFamilies } from './hooks/useFamilies';
import { useGroups } from './hooks/useGroups';
import { usePrefetchMemberships } from './hooks/useMemberships';
import { usePrefetchPersonDiscounts } from './hooks/usePersonDiscounts';
import { usePersons } from './hooks/usePersons';
import { useUpdatePerson } from './hooks/usePersonMutations';
import { buildPersonColumns } from './types/personColumns.tsx';
import { ACTIVE_ID, buildGroupOptions, indexGroups, type PersonRow, toPersonRow, } from './types/personRows.ts';
import type { UpdatePersonPayload } from './types/types.ts';
import type { ColumnVisibilityState } from "@tanstack/react-table";


/**
 * Identifies this table's saved layout.
 */
const TABLE_KEY = 'persons';

const PAGE_HEIGHT = 'h-[calc(100dvh-7rem)]';

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

	const personList = useMemo(() => persons.data ?? [], [persons.data]);
	const groupList = useMemo(() => groups.data ?? [], [groups.data]);

	const groupsById = useMemo(() => indexGroups(groupList), [groupList]);

	const rows = useMemo(
		() => personList.map((person) => toPersonRow(person, groupsById)),
		[personList, groupsById],
	);

	const columns = useMemo(() => buildPersonColumns(buildGroupOptions(groupList)), [groupList]);

	const HIDDEN_COLS: ColumnVisibilityState = {
		groupKinds: false
	};

	const isLoading = persons.isPending || groups.isLoading;


	const handleCellEdit = useCallback(
		(rowId: string, columnId: string, value: unknown) => {
			const payload = toUpdatePayload(columnId, value);

			if (payload === null) {
				return;
			}

			updatePerson.mutate(
				{
					id: rowId,
					payload
				},
				{ onError: notifyApiError });
		},
		[updatePerson],
	);

	const handleRowContextMenu = useCallback(
		(event: MouseEvent, row: PersonRow) => {
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
		},
		[openContextMenu, openModal, prefetchMemberships, prefetchDiscounts],
	);

	const toolbar = (
		<div className="flex items-center">
			<div className="ml-5 mr-10 flex items-center gap-2">
				<QuickGroupFilters tags={ filterTags }/>
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

	return (
		<div className={ `styled-card overflow-hidden rounded-2xl ${ PAGE_HEIGHT }` }>
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
