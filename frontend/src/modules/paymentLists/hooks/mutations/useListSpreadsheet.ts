import { useMutation } from '@tanstack/react-query';
import { downloadTracked, saveBlob } from '@/lib/download';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { fetchListSpreadsheet } from '../../api/paymentListsApi.ts';
import { describeList } from '../../types/listLabels.ts';
import type { PaymentListView } from '../../types/types.ts';


/**
 * Fetches a list's finance sheet on demand and saves it.
 */
export function useListSpreadsheet() {
	const { hasPermission } = useAuth();

	const download = useMutation({
		mutationFn: (list: PaymentListView) => downloadTracked({
			fetch: (onTransferStart) => fetchListSpreadsheet(list.id, onTransferStart),
			pending: `Generowanie raportu ${ describeList(list) }. To może chwilę potrwać...`,
			transferring: 'Raport jest gotowy, pobieranie pliku...',
			done: (fileName) => `Zapisano raport ${ fileName }.`,
			deliver: ({ blob, fileName }) => saveBlob(blob, fileName),
		}),
	});

	return {
		//TODO: Change to proper permission after it is created
		canGenerate: hasPermission('READ_LISTS'),
		isPending: download.isPending,
		generate: download.mutate,
	};
}
