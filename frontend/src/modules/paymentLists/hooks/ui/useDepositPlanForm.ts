import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { dateToISO, todayInTimeZone } from '@/utils/dateUtils.ts';
import { formatCurrency, pluralise } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { useCreateDeposit, usePlanDeposit } from '@/modules/deposits/hooks/mutations/useDepositMutations.ts';
import { depositFormSchema, type DepositFormValues, optionalText, parseAmount, toInstant, } from '../../schemas/paymentSchemas';
import { scopeOfList } from '../../types/depositScope';
import type { DepositPlanView, PlanDepositPayload } from '@/modules/deposits/types/types.ts';
import type { PaymentListView } from '../../types/types.ts';


interface DepositPlanFormOptions {
	list: PaymentListView;
	defaultPersonIds?: string[];
}


export function useDepositPlanForm({ list, defaultPersonIds }: DepositPlanFormOptions) {
	const closeModal = useModalStore((state) => state.closeModal);

	const plan = usePlanDeposit();
	const create = useCreateDeposit();

	/** The plan the user is looking at, and the inputs it was worked out for. */
	const [approved, setApproved] = useState<{ view: DepositPlanView; signature: string } | null>(null);

	const form = useForm<DepositFormValues>({
		resolver: zodResolver(depositFormSchema),
		defaultValues: {
			personIds: defaultPersonIds ?? [],
			amount: '',
			paymentMethod: 'TRANSFER',
			receivedAt: dateToISO(todayInTimeZone()),
			note: '',
		},
	});

	const { control, handleSubmit } = form;

	/**
	 * The answers the plan depends on, and nothing else.
	 */
	const planInputs = useWatch({
		control,
		name: ['personIds', 'amount', 'receivedAt'],
	});

	const signature = JSON.stringify(planInputs);

	const current = approved !== null && approved.signature === signature ? approved.view : null;
	const stale = approved !== null && current === null;

	const toPlanPayload = (input: DepositFormValues): PlanDepositPayload => ( {
		amount: parseAmount(input.amount),
		personIds: input.personIds,
		scope: scopeOfList(list.type),
		monthsAhead: 3,
		receivedAt: toInstant(input.receivedAt),
	} );

	const runPlan = handleSubmit((input) => {
		const signatureNow = signature;

		plan.mutate(toPlanPayload(input), {
			onSuccess: (view) => setApproved({ view, signature: signatureNow }),
		});
	});

	const confirm = handleSubmit((input) => {
		if (current === null) {
			return;
		}

		create.mutate(
			{
				...toPlanPayload(input),
				paymentMethod: input.paymentMethod,
				note: optionalText(input.note),
				// Echoing the plan back is what makes the server refuse to settle anything else.
				expected: current.settlements.map((line) => ( { paymentId: line.paymentId, amount: line.amount } )),
			},
			{
				onSuccess: (deposit) => {
					notifySuccess(describeOutcome(deposit.code, current));
					closeModal();
				},
			},
		);
	});

	return {
		form,
		/** The plan on screen, or `null` while there is nothing to confirm. */
		current,
		/** A plan was read, then the answers behind it changed. */
		stale,
		busy: plan.isPending || create.isPending,
		planning: plan.isPending,
		planError: plan.error === null ? null : plan.error.message,
		saveError: create.error === null ? null : create.error.message,
		runPlan,
		confirm,
	};
}


/**
 * What the toast says once the money is recorded, since the plan is about to disappear off screen.
 */
function describeOutcome(code: string, plan: DepositPlanView): string {
	const count = plan.settlements.length;

	if (count === 0) {
		return `Zapisano wpłatę ${ code } - w całości jako nadpłatę.`;
	}

	const settled = `Zapisano wpłatę ${ code }, rozliczając ${ count } ${ pluralise(count, 'pozycję', 'pozycje', 'pozycji') }`;

	return plan.unallocatedAmount > 0
		? `${ settled }; ${ formatCurrency(plan.unallocatedAmount) } zostało jako nadpłata.`
		: `${ settled }.`;
}
