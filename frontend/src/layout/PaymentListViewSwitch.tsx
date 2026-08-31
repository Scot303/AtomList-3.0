import { motion } from 'framer-motion';
import { CreditCard, type LucideIcon, Wallet } from 'lucide-react';
import { NavLink } from 'react-router';

import { cn } from '@/lib/cn';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { usePrefetchInstructors } from '@/modules/instructors/hooks/useInstructors.ts';
import { usePrefetchPayments } from '@/modules/paymentLists/hooks/queries/usePayments.ts';
import { TRANSACTION_READ_PERMISSIONS, usePrefetchTransactions } from '@/modules/transactions/hooks/queries/useTransactions.ts';
import { paymentListDetailPath, paymentListTransactionsPath } from '@/routes/paths';
import { type PaymentListRouteView, usePaymentListRoute } from './usePaymentListRoute.ts';


const PILL_TRANSITION = { type: 'spring', stiffness: 380, damping: 32 } as const;


interface ViewTab {
	view: PaymentListRouteView;
	label: string;
	icon: LucideIcon;
	to: (listId: string) => string;
}


const TABS: readonly ViewTab[] = [
	{ view: 'payments', label: 'Płatności', icon: Wallet, to: paymentListDetailPath },
	{ view: 'transactions', label: 'Inne przychody / Wydatki', icon: CreditCard, to: paymentListTransactionsPath },
];


/**
 * Moves between the two screens of the list that is open, and shows which one that is.
 */
export function PaymentListViewSwitch() {
	const listRoute = usePaymentListRoute();

	const { hasPermission, hasAnyPermission } = useAuth();

	const prefetchPayments = usePrefetchPayments();
	const prefetchTransactions = usePrefetchTransactions();
	const prefetchInstructors = usePrefetchInstructors();


	if (listRoute === null || !hasAnyPermission(TRANSACTION_READ_PERMISSIONS)) {
		return null;
	}

	const { listId, view } = listRoute;


	const prefetch = (target: PaymentListRouteView) => {
		if (target === 'payments') {
			if (hasPermission('READ_PAYMENTS')) {
				prefetchPayments(listId);
			}

			return;
		}

		prefetchTransactions(listId);

		if (hasPermission('READ_INSTRUCTORS')) {
			prefetchInstructors();
		}
	};

	return (
		<nav
			aria-label="Widok listy"
			className={ cn(
				'ml-4 flex shrink-0 items-center gap-1 rounded-xl border p-1',
				'border-os-border-highlight bg-os-surface/25 shadow-md',
			) }
		>
			{ TABS.map(({ view: tabView, label, icon: Icon, to }) => {
				const active = tabView === view;

				return (
					<NavLink
						key={ tabView }
						to={ to(listId) }
						end
						title={ label }
						aria-label={ label }
						aria-current={ active ? 'page' : undefined }
						onMouseEnter={ () => prefetch(tabView) }
						onFocus={ () => prefetch(tabView) }
						className={ cn(
							'relative flex items-center gap-1.5 rounded-lg px-3 py-1.25 text-sm font-semibold transition-colors',
							'focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none',
							active ? 'text-os-text' : 'cursor-pointer text-os-text-muted hover:text-os-text',
						) }
					>
						{ active && (
							<motion.span
								layoutId="payment-list-view-pill"
								aria-hidden
								className="absolute inset-0 rounded-lg bg-os-primary/15"
								transition={ PILL_TRANSITION }
							/>
						) }

						<Icon size={ 16 } className={ cn('relative shrink-0', active && 'text-os-primary') }/>
						<span className="relative hidden whitespace-nowrap sm:inline">{ label }</span>
					</NavLink>
				);
			}) }
		</nav>
	);
}
