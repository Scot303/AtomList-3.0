import { cn } from '@/lib/cn.ts';

const SIZES = {
	sm: 'size-4 border-2',
	md: 'size-5 border-2',
	lg: 'size-8 border-[3px]',
} as const;

interface SpinnerProps {
	size?: keyof typeof SIZES;
	className?: string;
	label?: string | null;
}

export function Spinner({ size = 'md', className, label = 'Ładowanie' }: SpinnerProps) {
	return (
		<span
			role={ label === null ? undefined : 'status' }
			aria-label={ label ?? undefined }
			className={ cn(
				'inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em]',
				SIZES[size],
				className,
			) }
		/>
	);
}
