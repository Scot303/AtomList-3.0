import { formatCurrency, formatPercent } from '@/lib/locale';
import { LinePanel, MoneyLine, TextLine } from '@/components/shared/MoneyLines.tsx';
import type { PaymentView } from '../../types/types.ts';


/** A quantity reads as a plain count, so "3" rather than "3,00". */
function formatQuantity(quantity: number): string {
	return String(Number(quantity.toFixed(2)));
}


export function ChargeBreakdown({ payment }: { payment: PaymentView }) {
	const discounted = payment.discountAmount > 0 || payment.discountPercent > 0;

	return (
		<LinePanel title="Naliczenie płatności:">
			<TextLine label="Stawka × ilość:">
				<span className="tabular-nums">
					{ formatCurrency(payment.unitCost) } × { formatQuantity(payment.quantity) }
				</span>
			</TextLine>

			<MoneyLine label="Obliczona kwota:" amount={ payment.gross }/>

			{ discounted && (
				<MoneyLine
					label="Zniżka:"
					amount={ -payment.discountAmount }
					tone="good"
					suffix={ payment.discountPercent > 0 ? <span className="ml-1 text-os-text-muted">({ formatPercent(payment.discountPercent) })</span> : undefined }
				/>
			) }

			<MoneyLine label="Do zapłaty:" amount={ payment.amountToPay } separated/>
			<MoneyLine label="Rozliczono:" amount={ payment.amountSettled }/>
			<MoneyLine
				label="Pozostało:"
				amount={ payment.outstanding }
				tone={ payment.outstanding > 0 ? 'bad' : 'good' }
			/>
		</LinePanel>
	);
}
