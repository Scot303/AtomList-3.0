import type { ReactNode } from 'react';
import { History, Wallet } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs/TabPanel';


/** Money arriving now, or what is left of money that arrived earlier. */
export type SettleMode = 'fresh' | 'credit';


interface SettleModeSwitchProps {
	mode: SettleMode;
	onChange: (mode: SettleMode) => void;
	/** How many earlier handovers still have credit to spend, so the tab can say so. */
	creditCount: number;
	freshContent: ReactNode;
	creditContent: ReactNode;
	className?: string;
}


export function SettleModeSwitch({ mode, onChange, creditCount, freshContent, creditContent, className }: SettleModeSwitchProps) {
	return (
		<Tabs
			className={ className }
			fillPanels
			spacing="default"
			selectedIndex={ mode === 'fresh' ? 0 : 1 }
			onChange={ (index) => onChange(index === 0 ? 'fresh' : 'credit') }
			tabs={ [
				{ label: 'Nowa wpłata', icon: <Wallet size={ 16 }/>, content: freshContent },
				{ label: `Z poprzednich wpłat (${ creditCount })`, icon: <History size={ 16 }/>, content: creditContent },
			] }
		/>
	);
}
