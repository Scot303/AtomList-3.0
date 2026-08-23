import { Coins } from 'lucide-react';
import { usePrefetchPersonCredit } from '@/modules/deposits/hooks/usePersonCredit';
import { preloadModal } from '@/stores/modalRegistry';
import { useModalStore } from '@/stores/modalStore';
import { coveredPersonLabel, type CoveredPersonView } from '@/types/finance.ts';


interface CoveredPersonsProps {
	persons: CoveredPersonView[];
}


export function CoveredPersons({ persons }: CoveredPersonsProps) {
	const openModal = useModalStore((state) => state.openModal);

	const prefetchPersonCredit = usePrefetchPersonCredit();

	const prefetch = (personId: string) => {
		preloadModal('deposits.personCredit');
		prefetchPersonCredit(personId);
	};

	if (persons.length === 0) {
		return null;
	}

	return (
		<section className="space-y-1.5">
			<h3 className="text-sm font-bold tracking-wide text-os-primary uppercase">Osoby opłacane przez wpłatę</h3>

			<ul className="flex flex-wrap gap-2">
				{ persons.map((person) => (
					<li key={ person.id }>
						<button
							type="button"
							title={ `Pokaż wszystkie nadpłaty: ${ coveredPersonLabel(person) }` }
							onMouseEnter={ () => prefetch(person.id) }
							onFocus={ () => prefetch(person.id) }
							onClick={ () => void openModal('deposits.personCredit', {
								personId: person.id,
								personName: person.fullName,
							}) }
							className="inline-flex items-center gap-1.5 rounded-lg border border-os-border px-2.5 py-1 text-sm font-medium
							text-os-text transition-colors outline-none hover:bg-white/3 focus-visible:ring-2 focus-visible:ring-os-primary/40"
						>
							<Coins size={ 13 } aria-hidden className="text-os-text-muted"/>
							{ coveredPersonLabel(person) }
						</button>
					</li>
				)) }
			</ul>
		</section>
	);
}
