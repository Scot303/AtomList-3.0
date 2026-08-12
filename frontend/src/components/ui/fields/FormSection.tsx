import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FormSectionProps {
	title: string;
	className?: string;
	children: ReactNode;
}

/**
 * A titled band of fields, three across once there is room.
 */
export const FormSection = ({ title, className, children }: FormSectionProps) => (
	<fieldset className={ cn('min-w-0', className) }>
		<legend className="mb-3 text-base font-semibold tracking-wide text-os-primary uppercase">
			{ title }
		</legend>

		<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{ children }</div>
	</fieldset>
);
