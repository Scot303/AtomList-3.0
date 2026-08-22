import type { TagOption } from '@/components/ui/tags';
import { useGroups } from '@/modules/groups/hooks/useGroups.ts';
import { buildGroupOptions } from '@/modules/groups/types/groupRows.ts';
import { scopeOfList } from '../../types/depositScope.ts';
import type { PaymentListView } from '../../types/types.ts';


/**
 * The groups a payment creator on this list may name for a picker.
 */
export function useListGroupOptions(list: PaymentListView) {
	const groups = useGroups();
	const scope = scopeOfList(list.type);

	const options: TagOption[] = buildGroupOptions(
		( groups.data ?? [] ).filter((group) => group.active && group.type === scope),
	);

	return { options, isPending: groups.isPending, isError: groups.isError, error: groups.error };
}
