import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router';
import { ToastContainer } from 'react-toastify';

import { GlobalContextMenu } from '@/components/ui/modals/GlobalContextMenu';
import { GlobalDialog } from '@/components/ui/modals/GlobalDialog';
import { GlobalModal } from '@/components/ui/modals/GlobalModal';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/modules/auth/AuthProvider';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
	return (
		<QueryClientProvider client={ queryClient }>
			<BrowserRouter>
				<AuthProvider>
					<AppRoutes/>
					<GlobalModal/>
					<GlobalDialog/>
					<GlobalContextMenu/>
				</AuthProvider>
			</BrowserRouter>

			<ToastContainer
				position="top-right"
				theme="dark"
				autoClose={ 10000 }
				newestOnTop
				closeOnClick
				pauseOnFocusLoss={ false }
			/>

			{ import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={ false }/> : null }
		</QueryClientProvider>
	);
}
