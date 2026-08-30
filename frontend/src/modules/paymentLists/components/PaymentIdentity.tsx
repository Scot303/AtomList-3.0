import { TagBadge, TagBadgeOf } from '@/components/ui/tags';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups, resolveGroupColor } from '@/modules/groups/types/groupRows';
import { CHARGE_KIND_TAGS } from '../types/paymentRows';
import type { PaymentView } from '../types/types.ts';


interface PaymentIdentityProps {
	payment: PaymentView;
}


/** The person, charge kind, and billed group or description for a payment. */
export function PaymentIdentity({ payment }: PaymentIdentityProps) {
	const groups = useGroups();
	const groupsById = indexGroups(groups.data ?? []);
	const group = payment.groupId === null ? undefined : groupsById.get(payment.groupId);

	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="min-w-0">
				<p className="text-base font-bold text-os-text">{ payment.personName }</p>
				<p className="truncate text-sm text-os-text-muted ml-0.5 mt-0.5">
					{ payment.code } · <TagBadgeOf tag={ CHARGE_KIND_TAGS[payment.chargeKind] } size="sm"/>
				</p>
			</div>

			{ group !== undefined ? <TagBadge label={ group.name } color={ resolveGroupColor(group) }/> : payment.description }
		</div>
	);
}
