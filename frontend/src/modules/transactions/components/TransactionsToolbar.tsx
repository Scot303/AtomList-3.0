import { Plus } from 'lucide-react';
import { type TableFilterTagsBinding, TagChipFilters } from '@/components/dataTable';
import { Button } from '@/components/ui/buttons/Button';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { usePrefetchInstructors } from '@/modules/instructors/hooks/useInstructors.ts';
import type { PaymentListView } from '@/modules/paymentLists/types/types.ts';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { EXPENSE_ID, TRANSACTION_TYPE_TITLES } from '../types/transactionRows.ts';
import { TYPE_FIELD, TYPE_FILTER_ID, TYPE_FILTER_OPTIONS } from '../utils/typeFilter.ts';
import type { TransactionType } from '../types/types.ts';


interface TransactionsToolbarProps {
	list: PaymentListView;
	tags: TableFilterTagsBinding;
	shownType: TransactionType | undefined;
}


export function TransactionsToolbar({ list, tags, shownType }: TransactionsToolbarProps) {
	const { hasPermission } = useAuth();
	const openModal = useModalStore((state) => state.openModal);

	const prefetchInstructors = usePrefetchInstructors();

	const canAdd = ( hasPermission('MODIFY_INCOME_TRANSACTIONS') || hasPermission('MODIFY_EXPENSE_TRANSACTIONS') ) && !list.closed;

	const prefetchAddModal = () => {
		preloadModal('transactions.form');
		prefetchInstructors();
	};

	return (
		<div className="flex items-center">
			<div className="mr-10 ml-5 flex items-center gap-2">
				<TagChipFilters
					tags={ tags }
					filterId={ TYPE_FILTER_ID }
					field={ TYPE_FIELD }
					options={ TYPE_FILTER_OPTIONS }
					titles={ TRANSACTION_TYPE_TITLES }
				/>
			</div>

			{ canAdd && (
				<Button
					size="md"
					className="shrink-0 py-1.5"
					leftIcon={ <Plus size={ 14 }/> }
					onMouseEnter={ prefetchAddModal }
					onFocus={ prefetchAddModal }
					onClick={ () => void openModal('transactions.form', {
						listId: list.id,
						initialType: shownType ?? EXPENSE_ID,
					}) }
				>
					Dodaj
				</Button>
			) }
		</div>
	);
}
