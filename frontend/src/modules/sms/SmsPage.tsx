import { Send } from 'lucide-react';
import { DataTable } from '@/components/dataTable';
import { Button } from '@/components/ui/buttons/Button';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { usePrefetchGroups } from '@/modules/groups/hooks/useGroups';
import { usePrefetchPersons } from '@/modules/persons/hooks/queries/usePersons.ts';
import { useContextMenu } from '@/stores/menuStore';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { useSmsHistory } from './hooks/useSmsHistory';
import { useSmsRowMenu } from './hooks/useSmsRowMenu';
import { buildSmsColumns } from './types/smsColumns.tsx';
import { type SmsRow, toSmsRow } from './types/smsRows.ts';
import type { ColumnVisibilityState } from '@tanstack/react-table';


const TABLE_KEY = 'sms';

const HIDDEN_COLS: ColumnVisibilityState = {
	length: false,
};


export function SmsPage() {
	const { hasPermission } = useAuth();
	const canSend = hasPermission('SEND_SMS');

	const history = useSmsHistory();

	const openModal = useModalStore((state) => state.openModal);
	const openContextMenu = useContextMenu();
	const buildRowMenu = useSmsRowMenu();

	const prefetchPersons = usePrefetchPersons();
	const prefetchGroups = usePrefetchGroups();

	const rows = ( history.data ?? [] ).map(toSmsRow);
	const columns = buildSmsColumns();


	const prefetchComposer = () => {
		preloadModal('sms.send');
		prefetchPersons();
		prefetchGroups();
	};


	const toolbar = canSend ? (
		<Button
			size="md"
			className="shrink-0 py-1.5 ml-5"
			leftIcon={ <Send size={ 14 }/> }
			onMouseEnter={ prefetchComposer }
			onFocus={ prefetchComposer }
			onClick={ () => void openModal('sms.send', {}) }
		>
			Nowa wiadomość
		</Button>
	) : null;


	return (
		<div className="styled-card table-page">
			<DataTable
				moduleKey={ TABLE_KEY }
				data={ rows }
				columns={ columns }
				getRowId={ (row) => row.id }
				isLoading={ history.isLoading }
				enableGrouping
				emptyMessage="Nie wysłano jeszcze żadnej wiadomości"
				toolbar={ toolbar }
				initialColumnVisibility={ HIDDEN_COLS }
				onRowContextMenu={ (event, row: SmsRow) => openContextMenu(event, buildRowMenu(row)) }
			/>
		</div>
	);
}
