import { useRef, useState } from 'react';
import { ArrowRight, Pencil } from 'lucide-react';
import { TagBadge } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { formatCurrency, pluralise } from '@/lib/locale';
import { resolveGroupColor } from '@/modules/groups/types/groupRows.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { customPriceFor, type DraftMember, entriesFor, unitCostFor } from '../types/draft.ts';
import type { QuoteLine } from '../types/types.ts';


const MAX_ENTRIES = 12;
const MAX_PRICE = 99999.99;
const MAX_PRICE_DIGITS = String(Math.trunc(MAX_PRICE)).length;

const LINE_INPUT = 'h-6 appearance-none rounded-md border bg-os-surface px-1.5 text-right text-sm tabular-nums text-os-text outline-none ring-0';


interface MemberLinesProps {
	member: DraftMember;
	groupsById: Map<string, GroupView>;
	/** The priced lines by group id, or null while this configuration has not been quoted. */
	pricedByGroup: Map<string, QuoteLine> | null;
	onEntriesChange: (groupId: string, entries: number) => void;
	/** Null drops the agreed rate, putting the group back on its own price. */
	onCustomPriceChange: (groupId: string, price: number | null) => void;
}


export function MemberLines({ member, groupsById, pricedByGroup, onEntriesChange, onCustomPriceChange }: MemberLinesProps) {
	if (member.groupIds.length === 0) {
		return null;
	}

	return (
		<ul className="overflow-hidden rounded-xl border border-os-border">
			{ member.groupIds.map((groupId) => {
				const group = groupsById.get(groupId);

				if (group === undefined) {
					return null;
				}

				return (
					<Line
						key={ groupId }
						group={ group }
						entries={ entriesFor(member, groupId) }
						unitCost={ unitCostFor(member, group) }
						customPrice={ customPriceFor(member, groupId) }
						priced={ pricedByGroup?.get(groupId) ?? null }
						onEntriesChange={ (entries) => onEntriesChange(groupId, entries) }
						onCustomPriceChange={ (price) => onCustomPriceChange(groupId, price) }
					/>
				);
			}) }
		</ul>
	);
}


interface LineProps {
	group: GroupView;
	entries: number;
	/** The rate being billed, an agreed amount included. */
	unitCost: number;
	/** The agreed rate, or null while the group's own price stands. */
	customPrice: number | null;
	priced: QuoteLine | null;
	onEntriesChange: (entries: number) => void;
	onCustomPriceChange: (price: number | null) => void;
}


function Line({ group, entries, unitCost, customPrice, priced, onEntriesChange, onCustomPriceChange }: LineProps) {
	const perClass = group.billingType === 'PER_CLASS';
	const free = unitCost === 0;

	const gross = priced?.gross ?? unitCost * ( perClass ? entries : 1 );
	const net = priced?.amountToPay ?? null;
	const discounted = net !== null && net !== gross;

	return (
		<li className={ cn('flex items-center gap-3 border-b border-os-border/40 px-3 py-2 last:border-b-0', free && 'opacity-70') }>
			<span className="flex shrink-0 items-center gap-1">
				<TagBadge label={ group.name } color={ resolveGroupColor(group) }/>

				{ group.type === 'TOURNAMENT' && (
					<Tooltip content="Grupa turniejowa" className="shrink-0 items-center leading-none text-os-error">
						<span aria-hidden className="text-base leading-none font-bold">*</span>
						<span className="sr-only">Grupa turniejowa</span>
					</Tooltip>
				) }
			</span>

			{ perClass && (
				<div className="flex shrink-0 items-center ml-3 gap-1.5">
					<input
						type="text"
						inputMode="numeric"
						aria-label={ `Liczba wejść - ${ group.name }` }
						value={ entries }
						onFocus={ (event) => event.currentTarget.select() }
						onChange={ (event) => {
							const normalised = clampEntries(event.currentTarget.value.replace(/\D/g, ''));

							event.currentTarget.value = String(normalised);
							onEntriesChange(normalised);
						} }
						className={ cn(LINE_INPUT, 'w-12 border-os-border transition-colors focus:border-os-primary') }
					/>

					<span className="text-sm text-os-text-muted">{ pluralise(entries, 'wejście', 'wejścia', 'wejść') }</span>
				</div>
			) }

			<span className="ml-auto flex shrink-0 items-center justify-end gap-1.5">
				<PriceCell
					group={ group }
					perClass={ perClass }
					customPrice={ customPrice }
					gross={ gross }
					struck={ discounted }
					onChange={ onCustomPriceChange }
				/>

				{ discounted && (
					<>
						<ArrowRight aria-hidden className="size-3.5 shrink-0 text-os-text-muted"/>
						<span className="text-sm font-semibold text-os-green tabular-nums">{ formatCurrency(net) }</span>
					</>
				) }
			</span>
		</li>
	);
}


interface PriceCellProps {
	group: GroupView;
	perClass: boolean;
	/** The agreed rate, or null while the group's own price stands. */
	customPrice: number | null;
	/** The whole undiscounted charge for the line, which is what the cell reads out. */
	gross: number;
	/** Whether a discount has been quoted, which is what crosses the figure out. */
	struck: boolean;
	onChange: (price: number | null) => void;
}


const PRICE_CELL = 'flex h-6 w-32 shrink-0 items-center justify-end';


/**
 * What the line costs, and the pencil that overrides it.
 */
function PriceCell({ group, perClass, customPrice, gross, struck, onChange }: PriceCellProps) {
	const [editing, setEditing] = useState(false);

	/**
	 * Set while Escape is closing the input, so the blur that follows it does not commit what was abandoned.
	 */
	const abandoned = useRef(false);

	const overridden = customPrice !== null;
	const suffix = perClass ? 'za wejście' : 'miesięcznie';

	if (editing) {
		const commit = (raw: string) => {
			const parsed = parsePrice(raw);

			setEditing(false);

			if (parsed === undefined) {
				return;
			}

			// An amount equal to the group's own price is not an override - recording it would tint the pencil for nothing.
			onChange(parsed === null || parsed === group.costForAttending ? null : parsed);
		};

		return (
			<span className={ PRICE_CELL }>
				<input
					autoFocus
					type="text"
					inputMode="decimal"
					aria-label={ `Własna cena (${ suffix }) - ${ group.name }` }
					placeholder={ toInputValue(group.costForAttending) }
					defaultValue={ customPrice === null ? '' : toInputValue(customPrice) }
					onFocus={ (event) => event.currentTarget.select() }
					onChange={ (event) => {
						const input = event.currentTarget;
						const cleaned = sanitisePrice(input.value);

						if (cleaned === input.value) {
							return;
						}

						const caret = ( input.selectionStart ?? cleaned.length ) - ( input.value.length - cleaned.length );

						input.value = cleaned;
						input.setSelectionRange(caret, caret);
					} }
					onKeyDown={ (event) => {
						if (event.key === 'Enter') {
							event.preventDefault();
							event.currentTarget.blur();
						}

						if (event.key === 'Escape') {
							event.preventDefault();
							abandoned.current = true;
							setEditing(false);
						}
					} }
					onBlur={ (event) => {
						if (abandoned.current) {
							abandoned.current = false;

							return;
						}

						commit(event.currentTarget.value);
					} }
					className={ cn(LINE_INPUT, 'w-22 border-os-primary placeholder:text-os-text-muted') }
				/>
			</span>
		);
	}

	return (
		<span className={ cn(PRICE_CELL, 'gap-2') }>
			<Tooltip
				content={ overridden
					? `Własna cena ${ formatCurrency(customPrice) } ${ suffix }. \n Standardowa cena grupy: ${ formatCurrency(group.costForAttending) }. \n Wyczyść pole, aby wrócić do ceny grupy.`
					: `Ustaw indywidualną cenę dla tej osoby` }
				focusable={ false }
				className="shrink-0"
			>
				<button
					type="button"
					aria-label={ `Ustaw własną cenę - ${ group.name }` }
					onClick={ () => {
						abandoned.current = false;
						setEditing(true);
					} }
					className={ cn(
						'rounded-md p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-os-primary/50 focus-visible:outline-none',
						overridden ? 'bg-os-primary/10 text-os-primary hover:bg-os-primary/20' : 'text-os-text-muted hover:bg-os-primary/10 hover:text-os-primary',
					) }
				>
					<Pencil aria-hidden className="size-3.5"/>
				</button>
			</Tooltip>

			<span
				className={ cn(
					'text-right text-sm whitespace-nowrap tabular-nums',
					struck ? 'text-os-text-muted line-through decoration-os-text-muted/60' : 'text-os-text',
				) }
			>
				{ formatCurrency(gross) }
			</span>
		</span>
	);
}


function clampEntries(raw: string): number {
	const value = Number(raw);

	if (Number.isNaN(value)) {
		return 0;
	}

	return Math.min(Math.max(Math.trunc(value), 0), MAX_ENTRIES);
}


/**
 * Strips a half-typed rate down to what a price may look like: digits, one separator, and at most two decimals.
 */
function sanitisePrice(raw: string): string {
	const kept = raw.replace(/[^\d.,]/g, '');
	const separator = kept.search(/[.,]/);

	if (separator === -1) {
		return kept.slice(0, MAX_PRICE_DIGITS);
	}

	const whole = kept.slice(0, separator).slice(0, MAX_PRICE_DIGITS);
	const fraction = kept.slice(separator + 1).replace(/[.,]/g, '').slice(0, 2);

	return `${ whole }${ kept[separator] }${ fraction }`;
}


/**
 * Reads what was typed into an agreed rate.
 *
 * @return the rate, null to go back to the group's own price, or undefined when it is not a price at all and whatever stood should be left alone
 */
function parsePrice(raw: string): number | null | undefined {
	const trimmed = raw.trim().replace(',', '.');

	if (trimmed === '') {
		return null;
	}

	const value = Number(trimmed);

	if (Number.isNaN(value) || value < 0) {
		return undefined;
	}

	return Math.min(Math.round(value * 100) / 100, MAX_PRICE);
}


/**
 * The rate as it goes into the input - plain digits with a decimal comma, no currency around it.
 */
function toInputValue(amount: number): string {
	return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace('.', ',');
}
