import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { formatCurrency } from '@/lib/locale';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { useAllocateDeposit, usePlanDeposit } from '../useDepositMutations';
import { type CreditAllocationFormValues, creditAllocationSchema } from '../../schemas/depositSchemas';
import type { DepositPlanView, DepositView, PlanDepositPayload } from '../../types/types.ts';


/** How far past the deposit's own month the credit may pay ahead, once nothing is owed. */
const MONTHS_AHEAD = 3;


/** Manages the two-step flow for spending the remaining credit on a deposit. */
export function useAllocateCreditPlanForm(deposit: DepositView) {
	const closeModal = useModalStore((state) => state.closeModal);

	const plan = usePlanDeposit();
	const allocate = useAllocateDeposit();

	const [approved, setApproved] = useState<{ view: DepositPlanView; signature: string } | null>(null);

	const form = useForm<CreditAllocationFormValues>({
		resolver: zodResolver(creditAllocationSchema),
		mode: "onTouched",
		defaultValues: {
			personIds: deposit.coveredPersons.map((person) => person.id),
		},
	});

	const { control, handleSubmit } = form;

	const personIds = useWatch({
		control,
		name: 'personIds',
	});

	const signature = JSON.stringify(personIds);

	const current = approved !== null && approved.signature === signature ? approved.view : null;
	const stale = approved !== null && current === null;

	const toPlanPayload = (input: CreditAllocationFormValues): PlanDepositPayload => ( {
		amount: deposit.unallocatedAmount,
		personIds: input.personIds,
		scope: deposit.scope,
		receivedAt: deposit.receivedAt,
		monthsAhead: MONTHS_AHEAD,
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

		allocate.mutate(
			{
				id: deposit.id,
				payload: {
					personIds: input.personIds,
					monthsAhead: MONTHS_AHEAD,
				},
			},
			{
				onSuccess: (updated) => {
					notifySuccess(describeOutcome(deposit, updated));
					closeModal();
				},
			},
		);
	});

	return {
		form,
		/** The plan on screen, or `null` while there is nothing to confirm. */
		current,
		stale,
		busy: plan.isPending || allocate.isPending,
		planning: plan.isPending,
		planError: plan.error === null ? null : plan.error.message,
		saveError: allocate.error === null ? null : allocate.error.message,
		runPlan,
		confirm,
	};
}


/**
 * What the toast says once the credit is spent, since the plan is about to disappear off screen.
 */
function describeOutcome(before: DepositView, after: DepositView): string {
	const spent = before.unallocatedAmount - after.unallocatedAmount;
	const settled = `Rozliczono ${ formatCurrency(spent) } z wpłaty ${ after.code }`;

	return after.unallocatedAmount > 0
		? `${ settled }; ${ formatCurrency(after.unallocatedAmount) } pozostało jako nadpłata.`
		: `${ settled }.`;
}
