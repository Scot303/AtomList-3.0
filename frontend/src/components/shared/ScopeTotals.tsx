import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import type { GrossSplit, ScopeSplit } from '@/types/finance.ts';
import { BreakdownCard, BreakdownDivider } from './BreakdownCard.tsx';


interface ScopeTotalsProps {
	/** The undiscounted figures, shown on their own while nothing has been priced. */
	gross: GrossSplit;
	priced: ScopeSplit | null;
	title?: string;
	className?: string;
}


/**
 * What is owed on each of the two sheets, and altogether.
 */
export function ScopeTotals({ gross, priced, title, className }: ScopeTotalsProps) {
	const rows = [
		{ label: 'OPEN', gross: priced?.open.gross ?? gross.open, net: priced?.open.net ?? null },
		{ label: 'KLUBOWE', gross: priced?.tournament.gross ?? gross.tournament, net: priced?.tournament.net ?? null },
	];

	const total = { gross: priced?.total.gross ?? gross.total, net: priced?.total.net ?? null };

	// With nothing discounted anywhere, the emphasis column would sit empty, so the gross figures move into it instead.
	const anyDiscounted = [...rows, total].some((row) => isDiscounted(row.gross, row.net));

	return (
		<BreakdownCard title={ title } className={ className } gridClassName="grid-cols-[1fr_auto_auto]">
			{ rows.map((row) => (
				<Row key={ row.label } label={ row.label } gross={ row.gross } net={ row.net } grossOnly={ !anyDiscounted }/>
			)) }

			<BreakdownDivider className="col-span-3"/>

			<Row label="RAZEM" gross={ total.gross } net={ total.net } grossOnly={ !anyDiscounted } strong/>
		</BreakdownCard>
	);
}


interface RowProps {
	label: string;
	gross: number;
	/** Null until this configuration has been priced. */
	net: number | null;
	grossOnly?: boolean;
	strong?: boolean;
}


function Row({ label, gross, net, grossOnly = false, strong = false }: RowProps) {
	const discounted = isDiscounted(gross, net);
	const grossText = formatCurrency(gross);

	return (
		<>
			<span className={ cn('min-w-0 truncate tracking-wide text-sm', strong ? 'text-os-text' : 'text-os-text-muted') }>{ label }</span>

			<span
				aria-hidden={ grossOnly }
				className={ cn(
					'shrink-0 tabular-nums text-sm',
					grossOnly
						? 'text-transparent'
						: discounted
							? 'text-os-text-muted line-through decoration-os-text-muted/60'
							: strong ? 'text-os-text' : 'text-os-text-muted',
				) }
			>
				{ grossText }
			</span>

			<span
				aria-hidden={ !discounted && !grossOnly }
				className={ cn(
					'shrink-0 text-right tabular-nums text-base',
					strong ? 'font-semibold' : 'font-medium',
					discounted
						? 'text-os-green'
						: grossOnly
							? strong ? 'text-os-text' : 'text-os-text-muted'
							: 'text-transparent',
				) }
			>
				{ discounted ? formatCurrency(net) : grossText }
			</span>
		</>
	);
}


function isDiscounted(gross: number, net: number | null) {
	return net !== null && net !== gross;
}
