import { cn } from '@/lib/cn';
import type { ExtendedSelectOption } from './extendedSelectTypes';

interface ExtendedSelectValueProps {
	/** The selected options, in the order they should read. */
	options: ExtendedSelectOption[];
	multiple: boolean;
	/** Beyond this many, the rest collapse into a `+n` chip so the trigger keeps its height. */
	maxVisible?: number;
	className?: string;
}

/**
 * The selection as it appears inside a closed trigger, shared by the field and the inline variant.
 */
export const ExtendedSelectValue = (props: ExtendedSelectValueProps) => {
	const { options, multiple, maxVisible = 3, className } = props;

	if (options.length === 0) {
		return null;
	}

	if (!multiple) {
		const [option] = options;

		return (
			<span className={ cn('flex min-w-0 items-center gap-1.5 text-os-text', className) }>
				{ option.icon && <span className="shrink-0 text-os-text-muted">{ option.icon }</span> }
				<span className="truncate">{ option.name }</span>
			</span>
		);
	}

	const visible = options.slice(0, maxVisible);
	const overflow = options.length - visible.length;

	return (
		<span className={ cn('flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden', className) }>
			{ visible.map((option) => (
				<span
					key={ option.id }
					className="max-w-full truncate rounded-md px-1.5 py-0.5 text-sm text-os-text"
				>
					{ option.name }
				</span>
			)) }

			{ overflow > 0 && (
				<span className="shrink-0 rounded-md bg-os-bg-highlight px-1.5 py-0.5 text-sm text-os-text-muted">
					+{ overflow }
				</span>
			) }
		</span>
	);
};
