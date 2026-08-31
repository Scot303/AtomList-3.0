import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/locale';
import type { QuoteTotals } from '../types/types.ts';
import type { GrossTotals } from '../utils/grossTotals.ts';
import { BreakdownCard, BreakdownDivider } from './BreakdownCard.tsx';


interface ScopeTotalsProps {
	gross: GrossTotals;
	/** What the backend priced, or null while nothing has been calculated for this exact configuration. */
	quoted: QuoteTotals | null;
	title?: string;
	className?: string;
}


export function ScopeTotals({ gross, quoted, title, className }: ScopeTotalsProps) {
	const rows = [
		{ label: 'OPEN', gross: quoted?.open.gross ?? gross.open, net: quoted?.open.net ?? null },
		{ label: 'KLUBOWE', gross: quoted?.tournament.gross ?? gross.tournament, net: quoted?.tournament.net ?? null },
	];

	const total = { gross: quoted?.total.gross ?? gross.total, net: quoted?.total.net ?? null };

	return (
		<BreakdownCard title={ title } className={ className } gridClassName="grid-cols-[1fr_auto_auto]">
			{ rows.map((row) => (
				<Row key={ row.label } label={ row.label } gross={ row.gross } net={ row.net }/>
			)) }

			<BreakdownDivider className="col-span-3"/>

			<Row label="RAZEM" gross={ total.gross } net={ total.net } strong/>
		</BreakdownCard>
	);
}


interface RowProps {
	label: string;
	gross: number;
	/** Null until this configuration has been priced. */
	net: number | null;
	strong?: boolean;
}


function Row({ label, gross, net, strong = false }: RowProps) {
	const discounted = net !== null && net !== gross;

	return (
		<>
			<span className={ cn('min-w-0 truncate tracking-wide text-sm', strong ? 'text-os-text' : 'text-os-text-muted') }>{ label }</span>

			<span
				className={ cn(
					'shrink-0 tabular-nums text-sm',
					discounted ? 'text-os-text-muted line-through decoration-os-text-muted/60' : strong ? 'text-os-text' : 'text-os-text-muted',
				) }
			>
				{ formatCurrency(gross) }
			</span>

			<span
				aria-hidden={ !discounted }
				className={ cn('shrink-0 text-right tabular-nums text-base', strong ? 'font-semibold' : 'font-medium', discounted ? 'text-os-green' : 'text-transparent') }
			>
				{ discounted ? formatCurrency(net) : formatCurrency(gross) }
			</span>
		</>
	);
}
