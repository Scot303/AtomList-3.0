import { type ReactNode, useState } from 'react';
import { ArrowLeftRight, Lock, RotateCcw } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip/Tooltip.tsx';
import { cn } from '@/lib/cn.ts';
import { formatCurrency } from '@/lib/locale.ts';
import { notifyApiError } from '@/lib/toast.ts';
import { useUpdateMembership } from '../../hooks/useMemberships.ts';
import type { MembershipView, UpdateMembershipPayload } from '../../types/types.ts';


interface MembershipCostControlProps {
	membership: MembershipView;
	personId: string;
	canModify: boolean;
}


/**
 * What this membership is billed at: the group's rate, an individually agreed one over the top of it, and - for
 * somebody who joined part-way through a month - what that first month costs on its own.
 * Committed on blur.
 */
export function MembershipCostControl({ membership, personId, canModify }: MembershipCostControlProps) {
	const update = useUpdateMembership(personId);

	const save = (payload: UpdateMembershipPayload) => {
		update.mutate({ id: membership.id, payload }, { onError: notifyApiError });
	};

	const showFirstMonth = membership.billingType === 'MONTHLY' && membership.joinedMidMonth;
	const [showingFirstMonthRate, setShowingFirstMonthRate] = useState(false);
	const displayFirstMonthRate = showFirstMonth && showingFirstMonthRate;

	if (!canModify) {
		return (
			<RowField label="Stawka" className="min-w-0">
				<p className="text-sm text-os-text">
					{ formatCurrency(membership.effectiveCost) }
					{ membership.customMonthlyCost !== null && <span className="ml-2 text-xs text-os-text-muted">własna stawka</span> }
				</p>

				{ showFirstMonth && membership.firstMonthCost !== null && <p className="mt-1 text-xs text-os-text-muted">Pierwszy miesiąc: { formatCurrency(membership.firstMonthCost) }</p> }
			</RowField>
		);
	}

	return (
		<div className="flex min-w-0 flex-wrap items-end gap-x-2 gap-y-3">
			<div className="relative w-32 shrink-0">
				{ showFirstMonth && (
					<Tooltip focusable={ false } content={ displayFirstMonthRate ? 'Pokaż stawkę osoby' : 'Pokaż stawkę za pierwszy miesiąc' } className="absolute bottom-1 -left-8">
						<button
							type="button"
							disabled={ update.isPending }
							onClick={ () => setShowingFirstMonthRate((isShowing) => !isShowing) }
							aria-label={ displayFirstMonthRate ? 'Pokaż stawkę osoby' : 'Pokaż stawkę za pierwszy miesiąc' }
							className="inline-flex p-1 text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary disabled:pointer-events-none"
						>
							<ArrowLeftRight size={ 16 } aria-hidden/>
						</button>
					</Tooltip>
				) }

				{ displayFirstMonthRate ? (
					<RowField label="Pierwszy miesiąc">
						<RateInput
							key="first-month"
							value={ membership.firstMonthCost }
							placeholder={ String(membership.effectiveCost) }
							ariaLabel={ `Stawka za pierwszy miesiąc w grupie ${ membership.groupName }` }
							resetLabel={ `Zresetuj aby naliczać stawkę za pełny pierwszy miesiąc w grupie ${ membership.groupName }` }
							resetHint={ `Zresetuj aby naliczać stawkę za pełny miesiąc: ${ formatCurrency(membership.effectiveCost) }` }
							disabled={ update.isPending }
							onCommit={ (amount) => save({ firstMonthCost: amount }) }
							onClear={ () => save({ clearFirstMonthCost: true }) }
						/>
					</RowField>
				) : (
					<RowField label="Stawka osoby">
						<RateInput
							key="person-rate"
							value={ membership.customMonthlyCost }
							placeholder={ String(membership.groupDefaultCost) }
							ariaLabel={ `Stawka za grupę ${ membership.groupName }` }
							resetLabel={ `Wróć do stawki grupy ${ membership.groupName }` }
							resetHint={ `Wróć do stawki grupy: ${ formatCurrency(membership.groupDefaultCost) }` }
							disabled={ update.isPending }
							onCommit={ (amount) => save({ customMonthlyCost: amount }) }
							onClear={ () => save({ clearCustomMonthlyCost: true }) }
						/>
					</RowField>
				) }
			</div>

			<span aria-hidden className="pb-1 text-sm text-os-text-muted select-none">
				/
			</span>

			<RowField label="Stawka grupy" className="w-32 shrink-0">
				<div className="relative">
					<input
						readOnly
						tabIndex={ -1 }
						value={ formatCurrency(membership.groupDefaultCost) }
						aria-label={ `Stawka grupy ${ membership.groupName }` }
						className={ cn(COST_BOX, 'cursor-not-allowed border-dashed bg-os-surface/30 pr-7 text-os-text-muted') }
					/>
					<Lock size={ 12 } aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-os-text-muted"/>
				</div>
			</RowField>
		</div>
	);
}


interface RateInputProps {
	/** The amount actually saved, or null when this rate falls back to something else. */
	value: number | null;
	placeholder: string;
	ariaLabel: string;
	resetLabel: string;
	resetHint: string;
	disabled: boolean;
	onCommit: (amount: number) => void;
	onClear: () => void;
}


/**
 * One rate box: commits what was typed on blur and offers a way back to whatever an empty field falls back to.
 */
function RateInput({ value, placeholder, ariaLabel, resetLabel, resetHint, disabled, onCommit, onClear }: RateInputProps) {
	const [draft, setDraft] = useState(value === null ? '' : String(value));
	const [lastCommitted, setLastCommitted] = useState(value);

	if (lastCommitted !== value) {
		setLastCommitted(value);
		setDraft(value === null ? '' : String(value));
	}

	// Empties the draft up front, so the blur this click causes cannot commit the rate being undone.
	const reset = () => {
		setDraft('');
		onClear();
	};

	const commit = () => {
		const normalised = draft.replace(',', '.').trim();

		if (normalised === '') {
			if (value !== null) {
				onClear();
			}

			return;
		}

		const parsed = Number(normalised);

		if (Number.isNaN(parsed) || parsed < 0) {
			setDraft(value === null ? '' : String(value));
			return;
		}

		if (parsed !== value) {
			onCommit(parsed);
		}
	};

	return (
		<div className="relative">
			<input
				value={ draft }
				inputMode="decimal"
				disabled={ disabled }
				placeholder={ placeholder }
				aria-label={ ariaLabel }
				onChange={ (event) => setDraft(event.target.value) }
				onBlur={ commit }
				onKeyDown={ (event) => {
					if (event.key === 'Enter') {
						event.currentTarget.blur();
					}
				} }
				className={ cn(COST_BOX, 'bg-os-surface text-os-text transition-colors placeholder:text-os-text-muted focus:border-os-primary', value !== null && 'pr-7') }
			/>

			{ value !== null && (
				<Tooltip focusable={ false } content={ resetHint } className="absolute top-1/2 right-1.5 -translate-y-1/2">
					<button
						type="button"
						disabled={ disabled }
						onClick={ reset }
						aria-label={ resetLabel }
						className="inline-flex rounded-sm p-0.5 text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary disabled:pointer-events-none"
					>
						<RotateCcw size={ 12 } aria-hidden/>
					</button>
				</Tooltip>
			) }
		</div>
	);
}


/** Every rate box, so the editable ones and the read-only one keep identical metrics. */
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
