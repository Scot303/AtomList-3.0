import type React from 'react';
import { type Ref, useId, useMemo, useState } from 'react';
import { Pipette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/cn';
import { buildColorRamp } from '@/lib/color';
import { MAX_RECENT_COLORS, useRecentColorsStore } from '@/stores/recentColorsStore';
import { usePopover } from '@/hooks/usePopover';
import { Popover } from '@/components/ui/popover';
import { ColorSwatchRow } from './ColorSwatchRow';
import { FieldShell } from './FieldShell';
import { fieldControl, fieldControlWithLeftIcon, fieldLeftIcon, fieldRightAdornment, type FieldSize } from './fieldStyles';


const HEX_LENGTH = 6;

/** Tall enough for the picker on its own. */
const PANEL_HEIGHT = 400;

/** And what each swatch strip switched on under it adds to that. */
const SWATCH_ROW_HEIGHT = 80;

/** The transparency check pattern, for a value that is not yet a complete color. */
const NO_COLOUR = 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)';

interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'size'> {
	label: string;
	error?: string;
	hint?: string;
	leftIcon?: React.ReactNode;
	/** Six hex digits, no leading `#`. */
	value?: string;
	onChange?: (value: string) => void;
	size?: FieldSize;
	ref?: Ref<HTMLInputElement>;
	/** Adds a tint and shade ramp of whatever color the field currently holds under the picker. */
	shades?: boolean;
	/** Adds 10 most recently piked colors under the picker, and records what this field settles on among them. */
	recent?: boolean;
}

declare global {
	interface Window {
		EyeDropper?: {
			new(): { open: () => Promise<{ sRGBHex: string }> };
		};
	}
}

/**
 * A hex color field with a picker panel and, where the browser has one, an eyedropper.
 */
export const ColorPicker = (props: ColorPickerProps) => {
	const { className, label, error, hint, leftIcon, value = '', onChange, size = 'default', disabled, ref, shades, recent, onBlur, ...rest } = props;

	const id = useId();

	const [supportsEyeDropper] = useState(() => 'EyeDropper' in window);

	const recentColors = useRecentColorsStore((state) => state.colors);
	const rememberColor = useRecentColorsStore((state) => state.remember);

	/**
	 * What the field settled on is what gets remembered, not every color the pointer crossed on its way there -
	 * so the panel closing, rather than each `onChange` is what records one.
	 */
	const remember = () => {
		if (recent) {
			rememberColor(value);
		}
	};

	const popover = usePopover({
		width: '16rem',
		maxHeight: PANEL_HEIGHT + (shades ? SWATCH_ROW_HEIGHT : 0) + (recent ? SWATCH_ROW_HEIGHT : 0),
		align: 'end',
		onBlur: remember,
	});

	const { open, setReference, getReferenceProps, close } = popover;

	const isComplete = value.length === HEX_LENGTH;
	const hex = isComplete ? `#${ value }` : '#000000';

	const ramp = useMemo(() => (shades && isComplete ? buildColorRamp(value) : []), [shades, isComplete, value]);

	const emit = (next: string) => onChange?.(next.replace('#', '').toUpperCase());

	const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		emit(event.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, HEX_LENGTH));
	};

	const pickFromScreen = async () => {
		if (!window.EyeDropper) {
			return;
		}

		try {
			const result = await new window.EyeDropper().open();
			emit(result.sRGBHex);
			close();
		} catch {
			// Dismissing the eyedropper rejects. There is nothing to report: the color is unchanged.
		}
	};

	return (
		<FieldShell htmlFor={ id } label={ label } error={ error } hint={ hint } size={ size } disabled={ disabled }>
			<input
				id={ id }
				ref={ ref }
				type="text"
				inputMode="text"
				autoComplete="off"
				spellCheck={ false }
				maxLength={ HEX_LENGTH }
				disabled={ disabled }
				value={ value }
				aria-invalid={ error ? true : undefined }
				onChange={ handleInputChange }
				onBlur={ (event) => {
					remember();
					onBlur?.(event);
				} }
				{ ...rest }
				className={ cn(
					'peer block uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal',
					fieldControl(size, { hasError: Boolean(error), disabled, active: open }),
					leftIcon && fieldControlWithLeftIcon[size],
					size === 'sm' ? 'pr-10' : 'pr-16',
					className,
				) }
			/>

			{ leftIcon && (
				<div className={ fieldLeftIcon(size, { hasError: Boolean(error), active: open }) }>
					{ leftIcon }
				</div>
			) }

			<div className={ fieldRightAdornment(size) }>
				<button
					ref={ setReference }
					type="button"
					disabled={ disabled }
					aria-haspopup="dialog"
					aria-expanded={ open }
					aria-label="Wybierz kolor"
					{ ...getReferenceProps() }
					className={ cn(
						'shrink-0 rounded-md border-2 border-os-border transition-all outline-none focus-visible:border-os-primary',
						size === 'sm' ? 'h-5 w-5' : 'h-8 w-8 rounded-lg',
						disabled ? 'cursor-not-allowed' : 'cursor-pointer',
					) }
					style={ isComplete ? { backgroundColor: hex } : { background: NO_COLOUR } }
				/>
			</div>

			<Popover state={ popover }>
				<div
					role="dialog"
					aria-label={ label }
					className="popover-surface themed-scrollbar w-full overflow-y-auto rounded-xl p-4"
					onMouseDown={ (event) => event.stopPropagation() }
				>
					<HexColorPicker color={ hex } onChange={ emit } className="!w-full"/>

					{ (shades || recent) && (
						<div className="mt-3 space-y-3">
							{ shades && (
								<ColorSwatchRow
									nowrap
									title="Odcienie"
									colors={ ramp }
									current={ value }
									onPick={ emit }
								/>
							) }

							{ recent && (
								<ColorSwatchRow
									nowrap
									title="Ostatnio wybrane"
									colors={ recentColors }
									current={ value }
									onPick={ emit }
									slots={ MAX_RECENT_COLORS }
								/>
							) }
						</div>
					) }

					{ supportsEyeDropper && (
						<button
							type="button"
							onClick={ pickFromScreen }
							className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-os-border bg-os-surface px-4 py-2 text-sm font-medium text-os-text transition-colors outline-none hover:bg-os-border/30 focus-visible:border-os-primary"
						>
							<Pipette size={ 16 }/>
							Pobierz kolor z ekranu
						</button>
					) }
				</div>
			</Popover>
		</FieldShell>
	);
};
