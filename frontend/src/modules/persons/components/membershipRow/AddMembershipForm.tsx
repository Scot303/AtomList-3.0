import { useState } from 'react';
import { Info, Plus } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert.tsx';
import { Button } from '@/components/ui/buttons/Button.tsx';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { DatePicker, Input, parseISODate } from '@/components/ui/fields';
import { Tooltip } from '@/components/ui/tooltip/Tooltip.tsx';
import { dateToISO, todayInTimeZone } from '@/utils/dateUtils.ts';
import { formatCurrency } from '@/lib/locale.ts';
import { notifySuccess } from '@/lib/toast.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { useCreateMembership } from '../../hooks/useMembershipMutations.ts';
import type { MembershipView } from '../../types/types.ts';


interface AddMembershipFormProps {
	personId: string;
	groups: GroupView[];
	memberships: MembershipView[];
	/** True while the groups are still on their way, or when they cannot be listed at all. */
	groupsUnavailable: boolean;
}


/**
 * Puts a person into a group, on a date and optionally at a rate of their own.
 */
export function AddMembershipForm({ personId, groups, memberships, groupsUnavailable }: AddMembershipFormProps) {
	const createMembership = useCreateMembership(personId);

	const [groupId, setGroupId] = useState<string | undefined>(undefined);
	const [joinedAt, setJoinedAt] = useState(() => dateToISO(todayInTimeZone()));
	const [customCost, setCustomCost] = useState('');
	const [firstMonthCost, setFirstMonthCost] = useState('');
	const [error, setError] = useState<string | null>(null);

	/**
	 * Groups the person could still join: active ones they are not already attending.
	 */
	const alreadyIn = new Set(
		memberships.filter((membership) => membership.active).map((membership) => membership.groupId),
	);

	const options = groups
		.filter((group) => group.active && !alreadyIn.has(group.id))
		.map((group) => ( {
			id: group.id,
			name: group.name,
			icon: group.type === 'TOURNAMENT' ? <TournamentMarker/> : undefined,
			hint: formatCurrency(group.costForAttending),
		} ));

	const selectedGroup = groups.find((group) => group.id === groupId);

	const showFirstMonth = selectedGroup?.billingType === 'MONTHLY' && joinsMidMonth(joinedAt);

	const fullMonthCost = parseAmount(customCost) ?? selectedGroup?.costForAttending ?? 0;


	const changeDate = (next: string) => {
		setJoinedAt(next);

		if (!joinsMidMonth(next)) {
			setFirstMonthCost('');
		}
	};

	const changeGroup = (next: string | undefined) => {
		setGroupId(next);

		if (groups.find((group) => group.id === next)?.billingType !== 'MONTHLY') {
			setFirstMonthCost('');
		}
	};


	const submit = () => {
		setError(null);

		if (groupId === undefined) {
			setError('Wybierz grupę.');
			return;
		}

		const parsedCustomCost = parseAmount(customCost);

		if (parsedCustomCost === null) {
			setError('Inna stawka osoby musi być liczbą nie mniejszą niż 0.');
			return;
		}

		const parsedFirstMonth = showFirstMonth ? parseAmount(firstMonthCost) : undefined;

		if (parsedFirstMonth === null) {
			setError('Stawka za pierwszy miesiąc musi być liczbą nie mniejszą niż 0.');
			return;
		}

		if (parsedFirstMonth !== undefined && parsedFirstMonth > fullMonthCost) {
			setError(`Stawka za część miesiąca nie może kosztować więcej niż cały - ${ formatCurrency(fullMonthCost) }.`);
			return;
		}

		createMembership.mutate(
			{ groupId, joinedAt, customMonthlyCost: parsedCustomCost, firstMonthCost: parsedFirstMonth },
			{
				onSuccess: () => {
					notifySuccess('Osoba została dopisana do grupy.');
					setGroupId(undefined);
					setCustomCost('');
					setFirstMonthCost('');
					setJoinedAt(dateToISO(todayInTimeZone()));
				},
				onError: (failure) => setError(failure.message),
			},
		);
	};


	if (groupsUnavailable) {
		return (
			<Alert tone="warning">
				Nie można wczytać listy grup, więc dopisanie do nowej grupy jest teraz niedostępne.
			</Alert>
		);
	}

	return (
		<div className="styled-card rounded-2xl p-4">
			<div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[2fr_1fr_8rem]">
				<ExtendedSelect
					label="Grupa"
					options={ options }
					value={ groupId }
					onChange={ changeGroup }
					disabled={ createMembership.isPending }
					clearable
					placeholder={ options.length === 0 ? 'Brak grup do wyboru' : 'Wybierz grupę' }
				/>

				<DatePicker
					label="Od kiedy"
					value={ joinedAt }
					onChange={ changeDate }
					disabled={ createMembership.isPending }
				/>

				<Input
					label="Stawka osoby"
					inputMode="decimal"
					value={ customCost }
					onChange={ (event) => setCustomCost(event.target.value) }
					disabled={ createMembership.isPending }
					placeholder={ selectedGroup ? String(selectedGroup.costForAttending) : '' }
				/>
			</div>

			<div className="mt-3 grid grid-cols-1 items-end gap-3 sm:grid-cols-[2fr_1fr_8rem]">
				{ showFirstMonth && (
					<div className="flex min-w-0 items-end gap-2">
						<div className="min-w-0 flex-1">
							<Input
								label="Kwota za pierwszy miesiąc"
								inputMode="decimal"
								value={ firstMonthCost }
								onChange={ (event) => setFirstMonthCost(event.target.value) }
								disabled={ createMembership.isPending }
								placeholder="Podaj zredukowaną kwotę"
							/>
						</div>

						<div className="flex h-10 shrink-0 items-center">
							<Tooltip
								content={ <>
									Osoba zostanie dopisana do grupy w trakcie miesiąca - można ustawić jednorazową stawkę.<br/>Pozostaw pole puste aby naliczyć pełną stawkę
									- { formatCurrency(fullMonthCost) }.
								</> }
								className="items-center text-os-text-muted transition-colors hover:text-os-primary"
							>
								<Info className="size-5.5" aria-hidden="true"/>
							</Tooltip>
						</div>
					</div>
				) }

				<div className="flex justify-end sm:col-start-3">
					<Button
						type="button"
						variant="primary"
						size="md"
						onClick={ submit }
						isLoading={ createMembership.isPending }
						disabled={ options.length === 0 }
						leftIcon={ <Plus size={ 16 }/> }
					>
						Dodaj
					</Button>
				</div>
			</div>

			{ error !== null && <Alert tone="danger" className="mt-3">{ error }</Alert> }

		</div>
	);
}


function parseAmount(raw: string): number | null | undefined {
	const normalised = raw.replace(',', '.').trim();

	if (normalised === '') {
		return undefined;
	}

	const parsed = Number(normalised);

	return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}


function joinsMidMonth(joinedAt: string): boolean {
	const date = parseISODate(joinedAt);

	return date !== null && date.getDate() > 1;
}


/**
 * Says an option is a tournament group without stretching its name.
 */
function TournamentMarker() {
	return (
		<span className="text-sm leading-none font-bold text-os-error">
			<span aria-hidden>T</span>
		</span>
	);
}
