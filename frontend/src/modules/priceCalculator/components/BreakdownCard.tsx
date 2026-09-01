import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';


interface BreakdownCardProps {
	title?: ReactNode;
	gridClassName: string;
	className?: string;
	children: ReactNode;
}


export function BreakdownCard({ title, gridClassName, className, children }: BreakdownCardProps) {
	return (
		<div className={ cn('rounded-2xl border border-os-border px-4 py-3', className) }>
			{ title !== undefined && <h3 className="mb-2 text-sm font-bold tracking-wider text-os-primary uppercase">{ title }</h3> }

			<div className={ cn('grid items-baseline gap-x-4', gridClassName) }>{ children }</div>
		</div>
	);
}


interface BreakdownDividerProps {
	className: string;
}


export function BreakdownDivider({ className }: BreakdownDividerProps) {
	return <div aria-hidden className={ cn('my-1.5 border-t border-os-border', className) }/>;
}
