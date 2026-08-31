import { Navigate, Route, Routes } from 'react-router';
import { Dashboard } from '@/layout/Dashboard';
import { LoginPage } from '@/modules/auth/pages/LoginPage';
import { VerifyEmailPage } from '@/modules/auth/pages/VerifyEmailPage';
import { PaymentListDetailPage } from '@/modules/paymentLists/PaymentListDetailPage';
import { TransactionsPage } from '@/modules/transactions/TransactionsPage';
import { MODULES } from '@/modules/registry';
import { DEFAULT_AUTHENTICATED_PATH, paths } from './paths';
import { ProtectedRoute, RequirePermission } from './ProtectedRoute';


export function AppRoutes() {
	return (
		<Routes>
			{/* Reachable without a session: signing in, and the link mailed out to confirm an address. */ }
			<Route path={ paths.login } element={ <LoginPage/> }/>
			<Route path={ paths.verifyEmail } element={ <VerifyEmailPage/> }/>

			<Route element={ <ProtectedRoute/> }>
				<Route path="/" element={ <Dashboard/> }>
					<Route index element={ <Navigate to={ DEFAULT_AUTHENTICATED_PATH } replace/> }/>

					{ /* One route per module, guarded by the permissions declared alongside it in the registry - the same ones the sidebar filters the menu on. */ }
					{ MODULES.map(({ id, path, permissions, Component }) => (
						<Route
							key={ id }
							path={ path }
							element={
								<RequirePermission permissions={ permissions }>
									<Component/>
								</RequirePermission>
							}
						/>
					)) }

					<Route
						path={ paths.paymentListDetail }
						element={
							<RequirePermission permissions={ ['READ_LISTS'] }>
								<PaymentListDetailPage/>
							</RequirePermission>
						}
					/>

					<Route
						path={ paths.paymentListTransactions }
						element={
							<RequirePermission permissions={ ['READ_INCOME_TRANSACTIONS', 'READ_EXPENSE_TRANSACTIONS'] }>
								<TransactionsPage/>
							</RequirePermission>
						}
					/>
				</Route>
			</Route>

			<Route path="*" element={ <Navigate to="/" replace/> }/>
		</Routes>
	);
}
