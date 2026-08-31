import { Loader2 } from 'lucide-react';
import { type HTMLMotionProps, motion } from 'framer-motion';
import { cn } from '@/lib/cn.ts';


type ButtonVariant = 'primary' | 'secondary' | 'secondary_muted' | 'danger' | 'warning' | 'ghost' | 'ghost_primary';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';


interface ButtonProps extends HTMLMotionProps<'button'> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
}


export const Button = (props: ButtonProps) => {
	const {
		className,
		variant = 'primary',
		size = 'md',
		isLoading,
		leftIcon,
		children,
		disabled,
		...rest
	} = props;

	const isGhost = variant === 'ghost' || variant === 'ghost_primary';

	const baseStyles = cn(
		'relative inline-flex items-center justify-center font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden will-change-transform',
		!isGhost && 'border',
	);

	const variants = {
		primary: 'border-os-primary/50 text-os-primary bg-os-primary/5 hover:bg-os-primary/12 hover:text-os-primary shadow-os-primary/10',
		secondary: 'border-os-border-highlight text-os-text-muted bg-os-surface/25 hover:bg-os-border/15 hover:text-os-text shadow-black/5',
		secondary_muted: 'border-os-border-highlight text-os-text-muted bg-os-surface/25 hover:bg-os-border/25 hover:text-os-text-muted shadow-black/5',
		danger: 'border-os-error/50 text-os-error bg-os-error/5 hover:bg-os-error/10 hover:text-os-error shadow-os-error/10',
		warning: 'border-orange-500/50 text-orange-500 bg-orange-500/5 hover:bg-orange-500/10 hover:text-orange-500 shadow-orange-500/10',
		ghost: 'text-os-text-muted hover:text-os-text hover:bg-white/3 rounded-md',
		ghost_primary: 'text-os-primary hover:bg-os-primary/10 rounded-md',
	};

	const sizes = {
		sm: 'px-2.5 py-1 text-xs rounded-lg gap-1.5 shadow-md',
		md: 'pl-3 pr-3.5 py-2 text-sm rounded-xl gap-2 shadow-md',
		lg: 'px-6 py-2.5 text-sm rounded-xl gap-2 shadow-lg',
		xl: 'px-8 py-3 text-base rounded-2xl gap-2.5 shadow-lg',
	};

	const ghostSizes = {
		sm: 'px-2 py-0.5 text-xs gap-1.5',
		md: 'px-2.5 py-1 text-sm gap-2',
		lg: 'px-3 py-1.5 text-sm gap-2',
		xl: 'px-3 py-2 text-base gap-2.5',
	};

	return (
		<motion.button
			whileTap={ { scale: 0.98 } }
			className={ cn(
				baseStyles,
				variants[variant],
				isGhost ? ghostSizes[size] : sizes[size],
				className,
			) }
			disabled={ isLoading || disabled }
			{ ...rest }
		>
			{ isLoading ? (
				<Loader2 className="w-4 h-4 animate-spin"/>
			) : (
				<>
					{ leftIcon && <span className="shrink-0">{ leftIcon }</span> }
					<motion.span className="relative">{ children }</motion.span>
				</>
			) }
		</motion.button>
	);
};
