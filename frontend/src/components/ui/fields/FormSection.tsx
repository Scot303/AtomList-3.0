import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';


interface FormSectionProps {
	title?: string;
	fields?: 1 | 2 | 3;
	className?: string;
	children: ReactNode;
}


/**
 * A titled band of up to three fields, evenly distributed once there is room.
 */
export const FormSection = ({ title, fields = 3, className, children }: FormSectionProps) => {
	const columnsClass = {
		1: 'sm:grid-cols-1',
		2: 'sm:grid-cols-2',
		3: 'sm:grid-cols-3',
	}[fields];

	return (
		<fieldset className={ cn('min-w-0', className) }>
			{ title && (
				<legend className="mb-3 text-base font-semibold tracking-wide text-os-primary uppercase">
					{ title }
				</legend>
			) }

			<div className={ cn('grid grid-cols-1 gap-4', columnsClass) }>{ children }</div>
		</fieldset>
	);
};
