import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert } from '@/components/feedback/Alert';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { BirthdayIndicator } from '@/components/shared/BirthdayIndicator';
import { useIsDesktop, useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/cn';
import { usePersons } from '@/modules/persons/hooks/usePersons';
import { CustomListsPanel } from './components/paymentListsOverview/CustomListsPanel.tsx';
import { SeasonSwitcher } from './components/paymentListsOverview/SeasonSwitcher.tsx';
import { useCustomLists } from './hooks/usePaymentLists';
import { usePrefetchSeasonSummary, useSeasonSummary } from './hooks/useSeasonSummary';
import { currentSeasonStart } from './types/seasons.ts';
import { MonthCard } from '@/modules/paymentLists/components/paymentListsOverview/MonthCard.tsx';
import { useUiStore } from '@/stores/uiStore';


export function PaymentListsPage() {
	const [seasonStart, setSeasonStart] = useState(currentSeasonStart);
	const [seasonDirection, setSeasonDirection] = useState(0);

	const isDesktop = useIsDesktop();
	const is2xl = useMediaQuery('(min-width: 1900px)');
	const sidebarOpen = useUiStore((state) => ( isDesktop ? state.sidebarOpen : state.mobileNavOpen ));

	const summary = useSeasonSummary(seasonStart);
	const lists = useCustomLists();
	const persons = usePersons();
	const prefetchSeason = usePrefetchSeasonSummary();

	const months = summary.data ?? [];
	const personList = persons.data ?? [];

	const showCustomLists = is2xl || !sidebarOpen;

	const handleSeasonChange = (nextStart: number) => {
		setSeasonDirection(Math.sign(nextStart - seasonStart));
		setSeasonStart(nextStart);
	};

	return (
		<div className="full-height-page flex gap-4">
			<section className={ cn("flex min-w-0 flex-1 items-center flex-col",
				"gap-5 3xl:gap-10",
				"p-10 2xl:p-7 2xl:pt-5 2xl:pb-12 3xl:p-30"
			) }>
				<div className="relative flex w-full items-center justify-center">
					<BirthdayIndicator persons={ personList } className="absolute left-0 ml-1"/>

					<SeasonSwitcher startYear={ seasonStart } onChange={ handleSeasonChange } onPrime={ prefetchSeason }/>
				</div>

				{ summary.isPending ? (
					<div className="flex min-h-0 flex-1 items-center justify-center">
						<FullPageLoader/>
					</div>
				) : summary.isError ? (
					<div className="flex min-h-0 flex-1 items-center justify-center p-4">
						<Alert tone="danger">{ summary.error.message }</Alert>
					</div>
				) : (
					<AnimatePresence mode="wait" initial={ false }>
						<motion.div
							key={ seasonStart }
							initial={ { opacity: 0, x: seasonDirection * 24 } }
							animate={ { opacity: 1, x: 0 } }
							exit={ { opacity: 0, x: seasonDirection * -18, transition: { duration: 0.25, ease: 'easeOut' } } }
							transition={ { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
							className={ cn(
								'grid min-h-0 flex-1 overflow-y-auto lg:overflow-visible themed-scrollbar grid-cols-4 grid-rows-3',
								'gap-x-5 gap-y-0',
								'2xl:gap-x-10 2xl:gap-y-14',
								'3xl:gap-x-12 3xl:gap-y-20',
							) }
						>
							{ months.map((summary) => (
								<MonthCard key={ `${ summary.year }-${ summary.month }` } summary={ summary }/>
							)) }
						</motion.div>
					</AnimatePresence>
				) }
			</section>

			<div className={ cn('h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-out-soft', showCustomLists ? 'w-60 2xl:w-[20rem] 3xl:w-120' : 'w-0') }>
				<div
					inert={ !showCustomLists || undefined }
					className={ cn('h-full w-60 2xl:w-[20rem] 3xl:w-120 transition-opacity duration-200', showCustomLists ? 'opacity-100' : 'pointer-events-none opacity-0') }
				>
					<CustomListsPanel lists={ lists.data ?? [] } isLoading={ lists.isLoading }/>
				</div>
			</div>
		</div>
	);
}
