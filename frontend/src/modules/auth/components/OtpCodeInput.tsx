import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef } from 'react'
import { cn } from '@/lib/cn'
import { LOGIN_CODE_GROUP_SIZE, LOGIN_CODE_LENGTH, normalizeLoginCode } from '../constants'

interface OtpCodeInputProps {
	value: string
	onChange: (value: string) => void
	/** Fired once the last character lands, so the form can submit without a second gesture. */
	onComplete?: (value: string) => void
	disabled?: boolean
	invalid?: boolean
	autoFocus?: boolean
	length?: number
	groupSize?: number
}

/**
 * The sign-in code, split into groups of four to match how the email prints it.
 */
export function OtpCodeInput({ value, onChange, onComplete, disabled = false, invalid = false, autoFocus = false, length = LOGIN_CODE_LENGTH, groupSize = LOGIN_CODE_GROUP_SIZE, }: OtpCodeInputProps) {
	const groupCount = Math.ceil(length / groupSize);
	const inputs = useRef<Array<HTMLInputElement | null>>([]);
	const lastCompleted = useRef<string | null>(null);

	useEffect(() => {
		if (value.length < length) {
			lastCompleted.current = null;

			return;
		}

		// Guarded so a re-render on an already-complete code does not submit it a second time.
		if (lastCompleted.current !== value) {
			lastCompleted.current = value;
			onComplete?.(value);
		}
	}, [length, onComplete, value]);

	const focusGroup = (index: number, caret: 'start' | 'end' = 'end') => {
		const input = inputs.current[Math.min(Math.max(index, 0), groupCount - 1)];

		if (!input) {
			return;
		}

		input.focus();

		const position = caret === 'start' ? 0 : input.value.length;
		input.setSelectionRange(position, position);
	};

	const replaceFrom = (index: number, text: string) => {
		const start = index * groupSize;
		const next = (value.slice(0, start) + normalizeLoginCode(text)).slice(0, length);

		onChange(next);

		return next;
	};

	const handleChange = (index: number, raw: string) => {
		const typed = normalizeLoginCode(raw);
		const start = index * groupSize;
		const kept = value.slice(start + groupSize);
		const next = (value.slice(0, start) + typed + kept).slice(0, length);

		onChange(next);

		// Follow the caret into the next group once this one is full.
		const caretAt = start + typed.length;

		if (typed.length >= groupSize && caretAt < length) {
			focusGroup(Math.floor(caretAt / groupSize), 'start');
		}
	};

	const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const caret = input.selectionStart ?? 0;

		if (event.key === 'Backspace' && caret === 0 && index > 0) {
			event.preventDefault();
			focusGroup(index - 1, 'end');

			return;
		}

		if (event.key === 'ArrowLeft' && caret === 0 && index > 0) {
			event.preventDefault();
			focusGroup(index - 1, 'end');

			return;
		}

		if (event.key === 'ArrowRight' && caret === input.value.length && index < groupCount - 1) {
			event.preventDefault();
			focusGroup(index + 1, 'start');
		}
	};

	const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
		const pasted = normalizeLoginCode(event.clipboardData.getData('text'));

		if (pasted.length === 0) {
			return;
		}

		event.preventDefault();

		// A whole code pasted into whichever box happens to have focus is still a whole code, so it
		// fills the field from the start rather than overflowing off the end and losing its head.
		const startIndex = pasted.length >= length ? 0 : index;
		const next = replaceFrom(startIndex, pasted);

		focusGroup(Math.min(Math.floor(next.length / groupSize), groupCount - 1));
	};

	return (
		<div className="flex items-center gap-2 sm:gap-3">
			{ Array.from({ length: groupCount }, (_, index) => (
				<input
					key={ index }
					ref={ (element) => {
						inputs.current[index] = element
					} }
					value={ value.slice(index * groupSize, (index + 1) * groupSize) }
					onChange={ (event) => handleChange(index, event.target.value) }
					onKeyDown={ (event) => handleKeyDown(index, event) }
					onPaste={ (event) => handlePaste(index, event) }
					onFocus={ (event) => event.target.select() }
					disabled={ disabled }
					autoFocus={ autoFocus && index === 0 }
					maxLength={ groupSize }
					inputMode="text"
					autoCapitalize="none"
					autoCorrect="off"
					autoComplete={ index === 0 ? 'one-time-code' : 'off' }
					spellCheck={ false }
					className={ cn(
						'w-full min-w-0 rounded-xl border bg-os-surface px-1 py-1.5 text-center',
						'text-base tracking-widest text-os-text transition-colors outline-none',
						'disabled:cursor-not-allowed disabled:opacity-60',
						invalid
							? 'border-os-error focus:border-os-error focus:ring-0 selection:bg-os-primary/25'
							: 'border-os-border-highlight focus:ring-0 focus:border-os-primary selection:bg-os-primary/25',
					) }
				/>
			)) }
		</div>
	)
}
