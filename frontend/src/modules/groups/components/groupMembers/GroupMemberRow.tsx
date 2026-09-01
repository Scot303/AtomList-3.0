import { AlertTriangle, ChevronDown, Info, Users } from 'lucide-react';
import { usePopover } from '@/hooks/usePopover';
import { ActionMenu, type ActionMenuItem } from '@/components/ui/buttons/ActionMenu.tsx';
import { Tooltip } from '@/components/ui/tooltip/Tooltip.tsx';
import { cn } from '@/lib/cn';
import { usePrefetchMemberships } from '@/modules/persons/hooks/queries/useMemberships.ts';
import { calculateAge, formatPhone, formatYears } from '@/modules/persons/utils/personFormat';
import type { PersonView } from '@/modules/persons/types/types.ts';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';


const INACTIVE_HINT = 'Osoba nieaktywna, członkostwo powinno być zakończone.';

export const MEMBER_GRID = 'grid grid-cols-[3rem_minmax(0,1fr)_8rem_4rem_6rem] items-center gap-3 px-3';


interface GroupMemberRowProps {
	number: number;
	member: PersonView;
}


export function GroupMemberRow({ number, member }: GroupMemberRowProps) {
	const openModal = useModalStore((state) => state.openModal);

	const prefetchMemberships = usePrefetchMemberships();

	const popover = usePopover({ width: 'auto', align: 'end' });
	const { open, setReference, getReferenceProps } = popover;

	const age = calculateAge(member.dateOfBirth);
	const phone = formatPhone(member.effectivePhone);

	const primeActions = () => {
		preloadModal('persons.form');
		preloadModal('persons.groups');

		prefetchMemberships(member.id);
	};

	const actions: ActionMenuItem[] = [
		{
			id: 'details',
			label: 'Szczegóły osoby',
			icon: Info,
			onSelect: () => void openModal('persons.form', { personId: member.id }),
		},
		{
			id: 'groups',
			label: 'Inne grupy osoby',
			icon: Users,
			onSelect: () => void openModal('persons.groups', {
				personId: member.id,
				personName: member.fullName,
			}),
		},
	];

	return (
		<li
			className={ cn(
				MEMBER_GRID,
				'border-b border-os-border/40 py-2 text-sm last:border-b-0',
				!member.active && 'opacity-50',
			) }
		>
			<span className="text-os-text-muted">{ number }</span>

			<span className="flex min-w-0 items-center gap-1.5">
				<span className="truncate" title={ member.fullName }>{ member.fullName }</span>

				{ !member.active && (
					<Tooltip content={ INACTIVE_HINT } className="shrink-0 items-center text-os-warning">
						<AlertTriangle aria-hidden className="size-3.5"/>
						<span className="sr-only">{ INACTIVE_HINT }</span>
					</Tooltip>
				) }
			</span>

			<span className="truncate font-mono text-sm text-os-text-muted">
				{ phone === '' ? '–' : phone }
			</span>

			<span className="text-sm text-os-text-muted">
				{ age === null ? '–' : formatYears(age) }
			</span>

			<button
				ref={ setReference }
				type="button"
				onMouseEnter={ primeActions }
				onFocus={ primeActions }
				aria-haspopup="true"
				aria-expanded={ open }
				aria-label={ `Akcje dla ${ member.fullName }` }
				{ ...getReferenceProps() }
				className="inline-flex items-center justify-center gap-1 justify-self-end rounded-lg border border-os-border px-2.5 py-1 text-sm font-medium
				text-os-text-muted transition-colors outline-none hover:bg-white/3 hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary/40"
			>
				Akcje

				<ChevronDown
					size={ 12 }
					aria-hidden
					className={ cn('transition-transform duration-200', open && 'rotate-180') }
				/>
			</button>

			<ActionMenu
				state={ popover }
				items={ actions }
				ariaLabel={ `Akcje dla ${ member.fullName }` }
			/>
		</li>
	);
}
