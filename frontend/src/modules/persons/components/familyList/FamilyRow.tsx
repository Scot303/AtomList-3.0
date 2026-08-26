import type { ReactNode } from 'react';
import { ChevronDown, StickyNote } from 'lucide-react';
import { usePopover } from '@/hooks/usePopover';
import { Popover } from '@/components/ui/popover';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { useDialogStore } from '@/stores/dialogStore';
import { FamilyEditPanel } from './FamilyEditPanel';
import type { FamilyView } from '../../types/types.ts';
import { formatPhone } from '../../utils/personFormat';


const PANEL_MAX_HEIGHT = 460;


interface FamilyRowProps {
	family: FamilyView;
	canModify: boolean;
}


export const FamilyRow = ({ family, canModify }: FamilyRowProps) => {

	const popover = usePopover({
		width: 'trigger',
		maxHeight: PANEL_MAX_HEIGHT,

		outsidePress: () => !useDialogStore.getState().isOpen,
	});

	const { open, setReference, getReferenceProps, close } = popover;
	const members = family.members.map((member) => member.name).join(', ');

	const details = (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
			<RowField label={ family.name } className="min-w-0 sm:w-72 sm:shrink-0">
				<p className="text-sm text-os-text-muted">
					{ family.members.length === 0 ? 'Brak osób w rodzinie' : `${ family.members.length } ${ family.members.length === 1 ? 'osoba' : 'osoby' }` }
				</p>
			</RowField>

			<RowField label="Telefon" className="sm:w-36 sm:shrink-0">
				{ family.phone === null ? 'Brak' : formatPhone(family.phone) }
			</RowField>

			<RowField label="Osoby" className="min-w-0 sm:flex-1">
				<span className="block truncate">{ members === '' ? 'Brak osób' : members }</span>
			</RowField>

			{ family.note !== null && family.note !== '' && (
				<div className="flex sm:self-center">
					<Tooltip content={ family.note } focusable={ false }>
						<StickyNote aria-hidden className="size-6 text-os-primary"/>
						<span className="sr-only">Notatka: { family.note }</span>
					</Tooltip>
				</div>
			) }

			{ canModify && <ChevronDown aria-hidden className={ cn('ml-8 size-5 shrink-0 self-end transition-transform sm:self-center', open && 'rotate-180') }/> }
		</div>
	);

	return (
		<>
			<li className={ cn('styled-card rounded-2xl transition-colors', open && 'border-os-primary   ') }>
				{ canModify ? (
					<button
						ref={ setReference }
						type="button"
						aria-expanded={ open }
						{ ...getReferenceProps() }
						className="w-full rounded-[inherit] px-4 py-3 text-left outline-none transition-colors hover:bg-white/3 focus-visible:ring-2 focus-visible:ring-os-primary/40"
					>
						{ details }
					</button>
				) : (
					<div className="px-4 py-3">{ details }</div>
				) }
			</li>

			{ canModify && (
				<Popover state={ popover }>
					<FamilyEditPanel family={ family } onClose={ close }/>
				</Popover>
			) }
		</>
	);
};


function RowField({ label, className, children }: { label: ReactNode; className?: string; children: ReactNode }) {
	return (
		<div className={ className }>
			<div className="mb-1 flex min-w-0 items-center gap-1.5 text-sm tracking-wide text-os-text uppercase">{ label }</div>
			<div className="text-sm text-os-text-muted">{ children }</div>
		</div>
	);
}
