import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn.ts';


const TONES = {
	info: {
		box: 'border-os-border-highlight text-os-text',
		icon: <Info className="size-4 shrink-0 text-os-text"/>,
	},
	success: {
		box: 'border-os-green text-os-green',
		icon: <CheckCircle2 className="size-4 shrink-0 text-os-green"/>,
	},
	warning: {
		box: 'border-os-warning text-os-warning',
		icon: <AlertTriangle className="size-4 shrink-0 text-os-warning"/>,
	},
	danger: {
		box: 'border-os-error text-os-error',
		icon: <XCircle className="size-4 shrink-0 text-os-error"/>,
	},
} as const;


interface AlertProps {
	tone?: keyof typeof TONES;
	title?: string;
	children: ReactNode;
	action?: ReactNode;
	className?: string;
	contentClassName?: string;
}


export function Alert({ tone = 'info', title, children, action, className, contentClassName }: AlertProps) {
	const { box, icon } = TONES[tone];

	return (
		<div
			role={ tone === 'danger' ? 'alert' : 'status' }
			className={ cn('flex gap-3 rounded-xl border px-3.5 py-3 text-sm', box, className) }
		>
			<span className="mt-0.5">{ icon }</span>

			<div className="min-w-0 flex-1">
				{ title ? <p className="font-semibold">{ title }</p> : null }
				<div className={ cn(title && 'mt-0.5', 'text-[13px] leading-relaxed opacity-90', contentClassName) }>
					{ children }
				</div>
				{ action ? <div className="mt-2.5">{ action }</div> : null }
			</div>
		</div>
	);
}
