import type { ReactNode } from 'react';
import { formatPercent } from '@/lib/locale';


interface DiscountSectionProps {
	icon: ReactNode;
	title: string;
	percent: number;
	lead: string;
	children: ReactNode;
}

/**
 * The shell both parts of the discount are read in: what it is worth, the one-line reason, then the working.
 */
export function DiscountSection({ icon, title, percent, lead, children }: DiscountSectionProps) {
	return (
		<section className="space-y-3">
			<header className="flex items-baseline justify-between gap-4 border-b border-os-border pb-2">
				<h3 className="flex items-center gap-2 font-semibold text-os-text text-lg">
					<span className="text-os-text-muted">{ icon }</span>
					{ title }
				</h3>

				<p className="shrink-0 text-lg font-bold text-os-text">{ formatPercent(percent) }</p>
			</header>

			<p className="text-sm text-os-text px-1">{ lead }</p>

			{ children }
		</section>
	);
}
