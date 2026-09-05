import { Info, Percent, Users, Wallet } from 'lucide-react';
import type { ContextMenuItem } from '@/stores/menuStore.ts';
import { preloadModal } from '@/stores/modalRegistry.ts';
import { useModalStore } from '@/stores/modalStore.ts';
import { currentYearMonth } from '@/utils/dateUtils.ts';
import { usePrefetchMemberships } from '../queries/useMemberships.ts';
import { usePrefetchPersonArrears } from '../queries/usePersonArrears.ts';
import { usePrefetchPersonDiscounts } from '../queries/usePersonDiscounts.ts';
import type { PersonRow } from '../../types/personRows.ts';
import { usePrefetchFamilies } from "@/modules/persons/hooks/queries/useFamilies.ts";


export type PersonRowMenuBuilder = (row: PersonRow) => ContextMenuItem[];


export function usePersonRowMenu(): PersonRowMenuBuilder {
	const openModal = useModalStore((state) => state.openModal);

	const prefetchMemberships = usePrefetchMemberships();
	const prefetchDiscounts = usePrefetchPersonDiscounts();
	const prefetchFamilies = usePrefetchFamilies();
	const prefetchArrears = usePrefetchPersonArrears();

	return (row: PersonRow) => {
		const { year, month } = currentYearMonth();

		preloadModal('persons.form');
		preloadModal('persons.discounts');
		preloadModal('persons.groups');
		preloadModal('persons.arrears');

		prefetchMemberships(row.id);
		prefetchDiscounts(row.id, year, month);
		prefetchFamilies();
		prefetchArrears(row.id);

		return [
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
			{
				id: 'arrears',
				label: 'Opłaty osoby',
				icon: Wallet,
				separatorBefore: true,
				onSelect: () => void openModal('persons.arrears', {
					personId: row.id,
					personName: row.person.fullName,
				}),
			},
		];
	};
}
