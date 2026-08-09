import type React from 'react';
import { type Ref, useId, useState } from 'react';
import { Pipette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/cn';
import { useSelectPopover } from '@/hooks/useSelectPopover';
import { SelectPopover } from '@/components/ui/select';
import { FieldShell } from './FieldShell';
import { fieldControl, fieldControlWithLeftIcon, fieldLeftIcon, fieldRightAdornment, type FieldSize } from './fieldStyles';


const HEX_LENGTH = 6;

/** The transparency check pattern, for a value that is not yet a complete color. */
const NO_COLOUR = 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)';

interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value' | 'size'> {
	label: string;
	error?: string;
	hint?: string;
	leftIcon?: React.ReactNode;
	/** Six hex digits, no leading `#`. Empty until a colour is chosen. */
	value?: string;
	onChange?: (value: string) => void;
	size?: FieldSize;
	ref?: Ref<HTMLInputElement>;
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
	const { className, label, error, hint, leftIcon, value = '', onChange, size = 'default', disabled, ref, ...rest } = props;

	const id = useId();

	const [supportsEyeDropper] = useState(() => 'EyeDropper' in window);

	const popover = useSelectPopover({ width: '16rem', maxHeight: 400 });
	const { open, setReference, getReferenceProps, close } = popover;

	const isComplete = value.length === HEX_LENGTH;
	const hex = isComplete ? `#${ value }` : '#000000';

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

			<SelectPopover popover={ popover }>
				<div
					role="dialog"
					aria-label={ label }
					className="popover-surface w-full rounded-xl p-4"
					onMouseDown={ (event) => event.stopPropagation() }
				>
					<HexColorPicker color={ hex } onChange={ emit } className="!w-full"/>

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
			</SelectPopover>
		</FieldShell>
	);
};
