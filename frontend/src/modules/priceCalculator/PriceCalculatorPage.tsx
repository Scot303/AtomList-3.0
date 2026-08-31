import { useRef, useState } from 'react';
import { Calculator, RotateCcw, UserPlus } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { notifyApiError } from '@/lib/toast';
import { useGroups } from '@/modules/groups/hooks/useGroups';
import { indexGroups } from '@/modules/groups/types/groupRows.ts';
import { MemberCard } from './components/MemberCard.tsx';
import { QuoteSummary } from './components/QuoteSummary.tsx';
import { usePriceQuote } from './hooks/usePriceQuote.ts';
import { type DraftMember, emptyMember, hasAnySelection, toPayload } from './types/draft.ts';
import type { PriceQuoteView } from './types/types.ts';
import { calculatorGroupOptions } from './utils/groupOptions.ts';
import { householdGross } from './utils/grossTotals.ts';


const MAX_MEMBERS = 5;


export function PriceCalculatorPage() {
	const groups = useGroups();
	const quote = usePriceQuote();

	const nextKey = useRef(1);

	const [members, setMembers] = useState<DraftMember[]>(() => [emptyMember('osoba-0')]);
	const [result, setResult] = useState<PriceQuoteView | null>(null);

	const groupList = groups.data ?? [];
	const groupsById = indexGroups(groupList);
	const groupOptions = calculatorGroupOptions(groupList);

	const gross = householdGross(members, groupsById);

	const canCalculate = hasAnySelection(members);

	const pristine = result === null && members.length === 1 && members[0].groupIds.length === 0 && !members[0].studentDiscount;

	/**
	 * Takes the change and drops the held quote with it - it was calculated for the configuration being replaced.
	 */
	const change = (next: DraftMember[]) => {
		setMembers(next);
		setResult(null);
		quote.reset();
	};

	const calculate = () => {
		quote.mutate(toPayload(members), {
			onSuccess: setResult,
			onError: notifyApiError,
		});
	};

	if (groups.isPending) {
		return (
			<div className="flex justify-center py-16">
				<Spinner/>
			</div>
		);
	}

	if (groups.isError) {
		return (
			<div className="mx-auto w-full max-w-5xl">
				<Alert tone="danger" title="Wczytywanie grup się nie powiodło. Odśwież stronę.">
					{ groups.error.message }
				</Alert>
			</div>
		);
	}

	return (
		<div className="no-scrollbar h-[calc(100dvh-7rem)] w-full overflow-y-auto">
			<div className="mx-auto w-full max-w-265 space-y-4 pr-10 pb-4">
				<header className="styled-card flex flex-wrap items-center gap-3 rounded-2xl px-4.5 py-3">
					<Calculator aria-hidden className="size-6 shrink-0 text-os-primary"/>

					<p className="min-w-0 flex-1 text-base text-os-text-muted">Dodaj wszystkie osoby, które zapisują się razem i wybierz ich grupy.</p>

					<div className="flex shrink-0 items-center gap-2">
						<Button
							variant="secondary_muted"
							size="md"
							leftIcon={ <RotateCcw size={ 14 }/> }
							disabled={ pristine }
							onClick={ () => {
								nextKey.current = 1;
								change([emptyMember('osoba-0')]);
							} }
						>
							Wyczyść
						</Button>

						<Button size="md" leftIcon={ <Calculator size={ 14 }/> } isLoading={ quote.isPending } disabled={ !canCalculate } onClick={ calculate }>
							Wylicz ceny
						</Button>
					</div>
				</header>

				{ groupOptions.length === 0 && (
					<Alert tone="warning" title="Brak aktywnych grup" contentClassName="text-sm">
						W systemie nie ma żadnej aktywnej grupy, więc nie ma z czego wyliczyć ceny.
					</Alert>
				) }

				{ members.map((member, index) => (
					<MemberCard
						key={ member.key }
						member={ member }
						ordinal={ index + 1 }
						groupOptions={ groupOptions }
						groupsById={ groupsById }
						quoted={ result?.members[index] ?? null }
						onRemove={ members.length === 1 ? null : () => change(members.filter((_, position) => position !== index)) }
						onChange={ (next) => change(members.map((existing, position) => ( position === index ? next : existing ))) }
					/>
				)) }

				<div className="flex items-center gap-3 mb-15">
					<Button
						variant="secondary"
						size="md"
						leftIcon={ <UserPlus size={ 14 }/> }
						disabled={ members.length >= MAX_MEMBERS }
						onClick={ () => change([...members, emptyMember(`osoba-${ nextKey.current++ }`)]) }
					>
						Dodaj osobę
					</Button>

					{ members.length >= MAX_MEMBERS && <p className="text-sm text-os-text-muted">Nie można wycenić więcej niż { MAX_MEMBERS } osób naraz.</p> }
				</div>

				<QuoteSummary gross={ gross } quote={ result }/>
			</div>
		</div>
	);
}
