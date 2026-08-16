import { type MouseEvent, useCallback, useMemo } from 'react';
import { Info, Plus, Users } from 'lucide-react';
import { DataTable, TagChipFilters, useTableFilterTags } from '@/components/dataTable';
import { Button } from '@/components/ui/buttons/Button';
import { notifyApiError } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { usePrefetchPersons } from '@/modules/persons/hooks/usePersons';
import { useContextMenu } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { ACTIVE_ID } from '@/types/rowTags.ts';
import { useGroups } from './hooks/useGroups';
import { useUpdateGroup } from './hooks/useGroupMutations';
import { buildGroupColumns } from './types/groupColumns.tsx';
import { GROUP_KIND_OPTIONS, type GroupRow, OPEN_KIND, toGroupRow, TOURNAMENT_KIND } from './types/groupRows.ts';
import type { UpdateGroupPayload } from './types/types.ts';


/**
 * Identifies this table's saved layout.
 */
const TABLE_KEY = 'groups';


/** The id the tag chips keep their filter under, and the column they filter. */
const KIND_FILTER_ID = 'groups-quick-kind';
const KIND_FIELD = 'kind';

const KIND_TITLES = {
	[OPEN_KIND]: 'Pokaż grupy OPEN',
	[TOURNAMENT_KIND]: 'Pokaż grupy turniejowe',
};


export function GroupsPage() {
	const { hasPermission } = useAuth();
	const canModify = hasPermission('MODIFY_GROUPS');
	const canReadPersons = hasPermission('READ_PERSONS');

	const groups = useGroups();
	const updateGroup = useUpdateGroup();

	const prefetchPersons = usePrefetchPersons();

	const openModal = useModalStore((state) => state.openModal);
	const openContextMenu = useContextMenu();

	const filterTags = useTableFilterTags(TABLE_KEY);

	const groupList = useMemo(() => groups.data ?? [], [groups.data]);

	const rows = useMemo(() => groupList.map(toGroupRow), [groupList]);

	const columns = useMemo(() => buildGroupColumns(), []);


	const handleCellEdit = useCallback(
		(rowId: string, columnId: string, value: unknown) => {
			const payload = toUpdatePayload(columnId, value);

			if (payload === null) {
				return;
			}

			updateGroup.mutate(
				{
					id: rowId,
					payload
				},
				{ onError: notifyApiError });
		},
		[updateGroup],
	);

	const handleRowContextMenu = useCallback(
		(event: MouseEvent, row: GroupRow) => {
			preloadModal('groups.form');
			preloadModal('groups.members');

			if (canReadPersons) {
				prefetchPersons();
			}

			openContextMenu(event, [
				{
					id: 'details',
					label: 'Szczegóły',
					icon: Info,
					onSelect: () => void openModal('groups.form', {
						groupId: row.id,
						groupName: row.name,
					}),
				},
				{
					id: 'members',
					label: 'Pokaż członków',
					icon: Users,
					onSelect: () => void openModal('groups.members', {
						groupId: row.id,
						groupName: row.name,
					}),
				},
			]);
		},
		[openContextMenu, openModal, prefetchPersons, canReadPersons],
	);

	const toolbar = (
		<div className="flex items-center">
			<div className="ml-5 mr-10 flex items-center gap-2">
				<TagChipFilters
					tags={ filterTags }
					filterId={ KIND_FILTER_ID }
					field={ KIND_FIELD }
					options={ GROUP_KIND_OPTIONS }
					titles={ KIND_TITLES }
				/>
			</div>

			{ canModify && (
				<Button
					size="md"
					className="shrink-0 py-1.5"
					leftIcon={ <Plus size={ 14 }/> }
					onMouseEnter={ () => preloadModal('groups.form') }
					onFocus={ () => preloadModal('groups.form') }
					onClick={ () => void openModal('groups.form') }
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
				isLoading={ groups.isLoading }
				enableGrouping
				emptyMessage="Brak grup do wyświetlenia"
				onCellEdit={ canModify ? handleCellEdit : undefined }
				onRowContextMenu={ handleRowContextMenu }
				toolbar={ toolbar }
			/>
		</div>
	);
}


/**
 * Null for a column that is not editable, so an unexpected id cannot turn into an empty PATCH.
 */
function toUpdatePayload(columnId: string, value: unknown): UpdateGroupPayload | null {
	switch (columnId) {
		case 'costForAttending': {
			if (value === null || value === '') {
				return null;
			}

			const cost = Number(value);

			return Number.isNaN(cost) || cost < 0 ? null : { costForAttending: cost };
		}

		case 'activeTag':
			return { active: value === ACTIVE_ID };

		default:
			return null;
	}
}
