import { formatInstantDate } from '@/utils/dateUtils.ts';
import type { PaymentListView } from '../../types/types.ts';


/**
 * What the list is, for the parts of it that are settled: how it bills, how it was built, and when.
 */
export const ListFacts = ({ list }: { list: PaymentListView }) => {
	const mode = list.populationMode === 'BY_GROUPS'
		? 'z wybranych grup'
		: list.populationMode === 'BY_PERSONS' ? 'z wybranych osób' : 'nieznany';

	const kind = list.type === 'CAMP' ? 'Lista obozowa' : 'Lista niestandardowa';

	return (
		<dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm px-0.5">
			<Fact label="Rodzaj" value={ kind }/>
			<Fact label="Skład" value={ mode }/>
			<Fact label="Utworzona" value={ formatInstantDate(list.createdAt) }/>
			<Fact label="Status" value={ list.closed ? 'Zamknięta' : 'Otwarta' }/>
		</dl>
	);
};


const Fact = ({ label, value }: { label: string; value: string }) => (
	<div className="flex items-baseline justify-between gap-2">
		<dt className="text-os-text-muted">{ label }:</dt>
		<dd className="truncate font-medium text-os-text">{ value }</dd>
	</div>
);
