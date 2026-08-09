import { Fragment, type ReactNode, useState } from 'react';
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';


export interface TabItem {
	label: string;
	icon?: ReactNode;
	content: ReactNode;
}

/** How much room sits between the tab strip and its panel. */
export type TabSpacing = 'none' | 'default';

interface TabsProps {
	tabs: TabItem[];
	/** Starting tab when the component manages its own selection. */
	defaultIndex?: number;
	/** Pass this to drive the selection from outside; `onChange` then has to move it. */
	selectedIndex?: number;
	onChange?: (index: number) => void;
	spacing?: TabSpacing;
	className?: string;
}

const SPACING: Record<TabSpacing, string> = {
	none: 'mb-0',
	default: 'mb-10',
};

export const Tabs = (props: TabsProps) => {
	const { tabs, defaultIndex = 0, selectedIndex, onChange, spacing = 'default', className } = props;

	const [uncontrolled, setUncontrolled] = useState({ index: defaultIndex, direction: 1 });
	const [controlledDirection, setControlledDirection] = useState(1);

	const isControlled = selectedIndex !== undefined;
	const index = isControlled ? selectedIndex : uncontrolled.index;
	const direction = isControlled ? controlledDirection : uncontrolled.direction;

	const handleChange = (next: number) => {
		const nextDirection = next > index ? 1 : -1;

		if (isControlled) {
			setControlledDirection(nextDirection);
		} else {
			setUncontrolled({ index: next, direction: nextDirection });
		}

		onChange?.(next);
	};

	return (
		<TabGroup selectedIndex={ index } onChange={ handleChange } className={ className }>
			<TabList className={ cn('relative flex w-full border-b border-os-border', SPACING[spacing]) }>
				{ tabs.map((tab) => (
					<Tab key={ tab.label } as={ Fragment }>
						{ ({ selected }) => (
							<button
								type="button"
								className={ cn(
									'relative -mb-px flex flex-1 items-center justify-center gap-2 px-4 py-2.5 font-semibold transition-colors outline-none',
									selected ? 'text-os-primary' : 'text-os-text-muted hover:text-os-text',
								) }
							>
								{ tab.icon && <span className="shrink-0">{ tab.icon }</span> }
								<span className="whitespace-nowrap">{ tab.label }</span>
							</button>
						) }
					</Tab>
				)) }

				<motion.div
					aria-hidden
					className="absolute -bottom-px h-0.5 bg-os-primary"
					initial={ false }
					animate={ {
						left: `${ (index / tabs.length) * 100 }%`,
						width: `${ (1 / tabs.length) * 100 }%`,
					} }
					transition={ { type: 'spring', stiffness: 380, damping: 30 } }
				/>
			</TabList>

			<TabPanels>
				<AnimatePresence mode="wait" initial={ false }>
					<motion.div
						key={ index }
						initial={ { opacity: 0, x: direction * 20 } }
						animate={ { opacity: 1, x: 0 } }
						exit={ { opacity: 0, x: direction * -15, transition: { duration: 0.1 } } }
						transition={ { type: 'spring', stiffness: 260, damping: 20 } }
					>
						{ tabs.map((tab, tabIndex) => (
							<TabPanel key={ tab.label } static className="focus:outline-none">
								{ index === tabIndex && tab.content }
							</TabPanel>
						)) }
					</motion.div>
				</AnimatePresence>
			</TabPanels>
		</TabGroup>
	);
};
