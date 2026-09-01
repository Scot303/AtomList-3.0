import { useMutation } from '@tanstack/react-query';
import { postPriceQuote } from '../api/priceCalculatorApi.ts';


/**
 * Asks the backend what the configuration on screen would cost.
 */
export function usePriceQuote() {
	return useMutation({ mutationFn: postPriceQuote });
}
