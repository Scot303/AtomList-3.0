import { GraduationCap } from 'lucide-react';
import { DiscountSection } from './DiscountSection';


interface StudentDiscountSectionProps {
	/** Whether this person holds a student status. */
	held: boolean;
	percent: number;
}


export function StudentDiscountSection({ held, percent }: StudentDiscountSectionProps) {
	return (
		<DiscountSection
			icon={ <GraduationCap size={ 16 } aria-hidden/> }
			title="Zniżka studencka"
			percent={ percent }
		>
			<p className="px-1 text-sm">
				Osoba{ ' ' }
				{ held
					? <><span className="text-os-green font-semibold">posiada</span>{ ' ' }zniżkę studencką.</>
					: <><span className="text-os-error font-semibold">nie posiada</span>{ ' ' }zniżki studenckiej.</>
				}
			</p>
		</DiscountSection>
	);
}
