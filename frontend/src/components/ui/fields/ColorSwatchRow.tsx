import { Check } from 'lucide-react';
import { toHexColor } from '@/components/dataTable/config/tagColors';
import { cn } from '@/lib/cn';
import { isLightColor } from '@/lib/color';

interface ColorSwatchRowProps {
	title: string;
	/** Six hex digits each, no leading `#`. */
	colors: string[];
	/** The one currently held by the field, marked rather than merely offered. */
	current: string;
	onPick: (color: string) => void;
	/** Keeps a fixed-length ramp on one line. A history that grows wraps instead. */
	nowrap?: boolean;
	/** Holds the strip at this many squares, however few colors it has, padding the rest out as blanks. */
	slots?: number;
}

/** What every square shares, whether it offers a color or only holds the place of one. */
const SWATCH = 'flex h-6 min-w-0 flex-1 basis-6 items-center justify-center rounded-md border';

/**
 * A labeled strip of colors to choose from.
 */
export function ColorSwatchRow({ title, colors, current, onPick, nowrap, slots = 0 }: ColorSwatchRowProps) {
	const blanks = Math.max(0, slots - colors.length);

	if (colors.length === 0 && blanks === 0) {
		return null;
	}

	const selected = current.toUpperCase();

	return (
		<div>
			<p className="mb-1.5 px-0.5 text-xs font-medium tracking-wide text-os-text-muted uppercase">{ title }</p>

			<div className={ cn('flex gap-1.5', nowrap ? 'flex-nowrap' : 'flex-wrap') }>
				{ colors.map((color) => {
					const isCurrent = color.toUpperCase() === selected;

					return (
						<button
							key={ color }
							type="button"
							aria-label={ `#${ color }` }
							aria-pressed={ isCurrent }
							title={ `#${ color }` }
							onClick={ () => onPick(color) }
							style={ { backgroundColor: toHexColor(color) } }
							className={ cn(
								SWATCH,
								'transition-all outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-os-primary/60',
								isCurrent ? 'border-os-text/80' : 'border-os-border/60',
							) }
						>
							{ isCurrent && (
								<Check
									size={ 12 }
									aria-hidden
									className={ isLightColor(color) ? 'text-black/80' : 'text-white/80' }
								/>
							) }
						</button>
					);
				}) }

				{ Array.from({ length: blanks }, (_, index) => (
					<span
						key={ `blank-${ index }` }
						aria-hidden
						className={ cn(SWATCH, 'border-os-border/60 bg-white') }
					/>
				)) }
			</div>
		</div>
	);
}
