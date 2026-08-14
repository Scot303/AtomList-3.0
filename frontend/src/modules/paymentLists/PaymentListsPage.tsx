import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Alert } from '@/components/feedback/Alert';
import { FullPageLoader } from '@/components/feedback/FullPageLoader';
import { useIsDesktop, useMediaQuery } from '@/hooks/useMediaQuery';
import { LOCALE, TIME_ZONE } from '@/lib/locale';
import { cn } from '@/lib/cn';
import { CustomListsPanel } from './components/paymentListsOverview/CustomListsPanel.tsx';
import { YearSwitcher } from './components/paymentListsOverview/YearSwitcher.tsx';
import { usePaymentLists } from './hooks/usePaymentLists';
import { usePrefetchYearSummary, useYearSummary } from './hooks/useYearSummary';
import { isCustomList } from './types/listLabels.ts';
import { MonthCard } from '@/modules/paymentLists/components/paymentListsOverview/MonthCard.tsx';
import { useUiStore } from '@/stores/uiStore';


function currentYear(): number {
	return Number(new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, year: 'numeric' }).format(new Date()));
}

export function PaymentListsPage() {
	const [year, setYear] = useState(currentYear);
	const [yearDirection, setYearDirection] = useState(0);

	const isDesktop = useIsDesktop();
	const is2xl = useMediaQuery('(min-width: 1536px)');
	const sidebarOpen = useUiStore((state) => ( isDesktop ? state.sidebarOpen : state.mobileNavOpen ));

	const summary = useYearSummary(year);
	//TODO should query no all lists but first standard one from this year, and then all custom lists.
	const lists = usePaymentLists();

	const prefetchYear = usePrefetchYearSummary();

	const months = useMemo(() => summary.data ?? [], [summary.data]);

	const customLists = useMemo(() => ( lists.data ?? [] ).filter(isCustomList), [lists.data]);
	const showCustomLists = is2xl || !sidebarOpen;

	const handleYearChange = (nextYear: number) => {
		setYearDirection(Math.sign(nextYear - year));
		setYear(nextYear);
	};

	return (
		<div className="full-height-page flex gap-4">
			<section className={ cn("flex min-w-0 flex-1 items-center flex-col",
				"gap-5 3xl:gap-10",
				"p-10 2xl:p-7 2xl:pt-5 2xl:pb-12 3xl:p-30"
			) }>
				<YearSwitcher year={ year } onChange={ handleYearChange } onPrime={ prefetchYear }/>

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
							key={ year }
							initial={ { opacity: 0, x: yearDirection * 24 } }
							animate={ { opacity: 1, x: 0 } }
							exit={ { opacity: 0, x: yearDirection * -18, transition: { duration: 0.25, ease: 'easeOut' } } }
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
					<CustomListsPanel lists={ customLists } isLoading={ lists.isLoading }/>
				</div>
			</div>
		</div>
	);
}
