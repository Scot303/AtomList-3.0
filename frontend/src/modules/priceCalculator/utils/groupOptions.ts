import type { TagOption } from '@/components/ui/tags';
import { formatCurrency, LOCALE } from '@/lib/locale';
import { resolveGroupColor } from '@/modules/groups/types/groupRows.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';


/**
 * The groups a newcomer can be quoted for. Active groups only.
 *
 * Each hint carries the price, so whoever is quoting can see what a group costs without picking it first.
 */
export function calculatorGroupOptions(groups: GroupView[]): TagOption[] {
	return groups
		.filter((group) => group.active)
		.sort((left, right) => left.name.localeCompare(right.name, LOCALE))
		.map((group) => ( {
			id: group.id,
			name: group.name,
			color: resolveGroupColor(group),
			hint: hintFor(group),
		} ));
}


function hintFor(group: GroupView): string {
	const price = group.billingType === 'PER_CLASS'
		? `${ formatCurrency(group.costForAttending) } / wejście`
		: `${ formatCurrency(group.costForAttending) } / miesięcznie`;

	return group.type === 'TOURNAMENT' ? `turniejowa · ${ price }` : price;
}
