import { type ReactNode, useState } from 'react';
import { Lock, RotateCcw } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import { notifyApiError } from '@/lib/toast';
import { useUpdateMembership } from '../hooks/useMemberships';
import type { MembershipView } from '../types/types.ts';


interface MembershipCostControlProps {
	membership: MembershipView;
	personId: string;
	canModify: boolean;
}

/**
 * What this membership is billed at: the group's rate, or an individually agreed one over the top of it.
 * Committed on blur.
 */
export function MembershipCostControl({ membership, personId, canModify }: MembershipCostControlProps) {
	const update = useUpdateMembership(personId);

	const custom = membership.customMonthlyCost;
	const [draft, setDraft] = useState(custom === null ? '' : String(custom));
	const [lastCommitted, setLastCommitted] = useState(custom);

	if (lastCommitted !== custom) {
		setLastCommitted(custom);
		setDraft(custom === null ? '' : String(custom));
	}

	const clearCustomCost = () => {
		update.mutate(
			{
				id: membership.id,
				payload: { clearCustomMonthlyCost: true }
			},
			{ onError: notifyApiError }
		);
	};

	// Empties the draft up front, so the blur this click causes cannot commit the rate being undone.
	const resetToGroupCost = () => {
		setDraft('');
		clearCustomCost();
	};

	const commit = () => {
		const normalised = draft.replace(',', '.').trim();

		if (normalised === '') {
			if (custom !== null) {
				clearCustomCost();
			}

			return;
		}

		const parsed = Number(normalised);

		if (Number.isNaN(parsed) || parsed < 0) {
			setDraft(custom === null ? '' : String(custom));
			return;
		}

		if (parsed !== custom) {
			update.mutate(
				{
					id: membership.id,
					payload: { customMonthlyCost: parsed }
				},
				{ onError: notifyApiError }
			);
		}
	};

	if (!canModify) {
		return (
			<RowField label="Stawka" className="min-w-0">
				<p className="text-sm text-os-text">
					{ formatCurrency(membership.effectiveCost) }
					{ custom !== null && <span className="ml-2 text-xs text-os-text-muted">własna stawka</span> }
				</p>
			</RowField>
		);
	}

	return (
		<div className="flex min-w-0 flex-wrap items-end gap-x-2 gap-y-3">
			<RowField label="Stawka osoby" className="w-32 shrink-0">
				<div className="relative">
					<input
						value={ draft }
						inputMode="decimal"
						disabled={ update.isPending }
						placeholder={ String(membership.groupDefaultCost) }
						aria-label={ `Stawka za grupę ${ membership.groupName }` }
						onChange={ (event) => setDraft(event.target.value) }
						onBlur={ commit }
						onKeyDown={ (event) => {
							if (event.key === 'Enter') {
								event.currentTarget.blur();
							}
						} }
						className={ cn(
							COST_BOX,
							'bg-os-surface text-os-text transition-colors placeholder:text-os-text-muted focus:border-os-primary',
							custom !== null && 'pr-7',
						) }
					/>

					{ custom !== null && (
						<Tooltip
							focusable={ false }
							content={ `Wróć do stawki grupy: ${ formatCurrency(membership.groupDefaultCost) }` }
							className="absolute top-1/2 right-1.5 -translate-y-1/2"
						>
							<button
								type="button"
								disabled={ update.isPending }
								onClick={ resetToGroupCost }
								aria-label={ `Wróć do stawki grupy ${ membership.groupName }` }
								className="inline-flex rounded-sm p-0.5 text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary disabled:pointer-events-none"
							>
								<RotateCcw size={ 12 } aria-hidden/>
							</button>
						</Tooltip>
					) }
				</div>
			</RowField>

			{ /* The two rates read as one value: what this person pays, out of what the group charges. */ }
			<span aria-hidden className="pb-1 text-sm text-os-text-muted select-none">/</span>

			<RowField label="Stawka grupy" className="w-32 shrink-0">
				<div className="relative">
					<input
						readOnly
						tabIndex={ -1 }
						value={ formatCurrency(membership.groupDefaultCost) }
						aria-label={ `Stawka grupy ${ membership.groupName }` }
						className={ cn(COST_BOX, 'cursor-not-allowed border-dashed bg-os-surface/30 pr-7 text-os-text-muted') }
					/>
					<Lock
						size={ 12 }
						aria-hidden
						className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-os-text-muted"
					/>
				</div>
			</RowField>
		</div>
	);
}

/** Both rate boxes, so the editable one and the read-only one keep identical metrics. */
const COST_BOX = 'w-full rounded-lg border border-os-border px-2.5 py-1 text-sm outline-none';

/** A label above an inline control. */
function RowField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
	return (
		<div className={ className }>
			<p className="mb-1 text-xs tracking-wide text-os-text-muted uppercase">{ label }</p>
			{ children }
		</div>
	);
}
