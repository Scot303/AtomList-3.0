import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert.tsx';
import { Button } from '@/components/ui/buttons/Button.tsx';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { DatePicker, Input } from '@/components/ui/fields';
import { dateToISO, todayInTimeZone } from '@/components/ui/fields/dateUtils.ts';
import { formatCurrency } from '@/lib/locale.ts';
import { notifySuccess } from '@/lib/toast.ts';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { useCreateMembership } from '../../hooks/useMemberships.ts';
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
	const [error, setError] = useState<string | null>(null);

	/**
	 * Groups the person could still join: active ones they are not already attending.
	 */
	const options = useMemo(() => {
		const alreadyIn = new Set(
			memberships.filter((membership) => membership.active).map((membership) => membership.groupId),
		);

		return groups
			.filter((group) => group.active && !alreadyIn.has(group.id))
			.map((group) => ({
				id: group.id,
				name: group.name,
				icon: group.tournamentGroup ? <TournamentMarker/> : undefined,
				hint: formatCurrency(group.costForAttending),
			}));
	}, [groups, memberships]);

	const selectedGroup = groups.find((group) => group.id === groupId);

	const submit = () => {
		setError(null);

		if (groupId === undefined) {
			setError('Wybierz grupę.');
			return;
		}

		const normalised = customCost.replace(',', '.').trim();
		const parsed = normalised === '' ? undefined : Number(normalised);

		if (parsed !== undefined && (Number.isNaN(parsed) || parsed < 0)) {
			setError('Własna stawka musi być liczbą nie mniejszą niż 0.');
			return;
		}

		createMembership.mutate(
			{ groupId, joinedAt, customMonthlyCost: parsed },
			{
				onSuccess: () => {
					notifySuccess('Osoba została dopisana do grupy.');
					setGroupId(undefined);
					setCustomCost('');
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
					onChange={ setGroupId }
					disabled={ createMembership.isPending }
					clearable
					placeholder={ options.length === 0 ? 'Brak grup do wyboru' : 'Wybierz grupę' }
				/>

				<DatePicker
					label="Od kiedy"
					value={ joinedAt }
					onChange={ setJoinedAt }
					disabled={ createMembership.isPending }
				/>

				<Input
					label="Własna stawka"
					inputMode="decimal"
					value={ customCost }
					onChange={ (event) => setCustomCost(event.target.value) }
					disabled={ createMembership.isPending }
					placeholder={ selectedGroup ? String(selectedGroup.costForAttending) : '' }
				/>
			</div>

			{ error !== null && <Alert tone="danger" className="mt-3">{ error }</Alert> }

			<div className="mt-3 flex justify-end">
				<Button
					type="button"
					variant="ghost_primary"
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
	);
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
