import type { ReactNode } from 'react';
import { GraduationCap, Info, Trash2, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/fields';
import type { TagOption } from '@/components/ui/tags';
import { TagSelect } from '@/components/ui/tags';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { cn } from '@/lib/cn';
import { formatCurrency, formatPercent, pluralise } from '@/lib/locale';
import type { GroupView } from '@/modules/groups/types/types.ts';
import { type DraftMember, withCustomPrice, withEntries, withGroupIds } from '../types/draft.ts';
import type { QuoteLine, QuoteMember } from '../types/types.ts';
import { grossOf } from '../utils/grossTotals.ts';
import { BreakdownCard, BreakdownDivider } from './BreakdownCard.tsx';
import { MemberLines } from './MemberLines.tsx';
import { ScopeTotals } from './ScopeTotals.tsx';


const FAMILY_ORDER_HINT =
	'Kolejność w rodzinie ustala stała miesięczna kwota - najdroższa osoba jest pierwsza, więc dostaje najmniejszą zniżkę. \n\n' +
	'Grupy rozliczane za wejście nie wchodzą do tej kwoty, bo ich koszt zależy od obecności. \n\n Przy równych kwotach decyduje kolejność wpisania.';


interface MemberCardProps {
	member: DraftMember;
	/** Which person this is, counting from 1, as the heading names them. */
	ordinal: number;
	groupOptions: TagOption[];
	groupsById: Map<string, GroupView>;
	/** This person's quote, or null while the configuration on screen has not been priced. */
	quoted: QuoteMember | null;
	/** Left out for the only person on screen - a household of one cannot be broken up any further. */
	onRemove: ( () => void ) | null;
	onChange: (member: DraftMember) => void;
}


export function MemberCard({ member, ordinal, groupOptions, groupsById, quoted, onRemove, onChange }: MemberCardProps) {
	const gross = grossOf(member, groupsById);
	const pricedByGroup = quoted === null ? null : indexLines(quoted.lines);

	return (
		<div className="relative w-full">
			<section className="popover-surface min-w-0 rounded-2xl p-4" aria-label={ `Osoba ${ ordinal }` }>
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
					<div className="min-w-0 space-y-3">
						<header className="mb-4 flex min-w-0 items-center gap-3">
							<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-os-primary/15 text-sm font-bold text-os-primary">{ ordinal }</span>

							<h2 className="shrink-0 text-base font-semibold text-os-text">Osoba { ordinal }</h2>

							{ quoted !== null && <PositionChip quoted={ quoted }/> }
						</header>

						<Checkbox label="Zniżka studencka" className="px-1" checked={ member.studentDiscount } onChange={ (event) => onChange({ ...member, studentDiscount: event.target.checked }) }/>

						<TagSelect
							multiple
							label="Grupy"
							placeholder="Wybierz grupy…"
							options={ groupOptions }
							value={ member.groupIds }
							onChange={ (groupIds) => onChange(withGroupIds(member, groupIds)) }
							clearable
						/>

						<div className="mt-5">
							<MemberLines
								member={ member }
								groupsById={ groupsById }
								pricedByGroup={ pricedByGroup }
								onEntriesChange={ (groupId, entries) => onChange(withEntries(member, groupId, entries)) }
								onCustomPriceChange={ (groupId, price) => onChange(withCustomPrice(member, groupId, price)) }
							/>

							{ member.groupIds.length === 0 && (
								<p className="px-1 text-sm text-os-text-muted">Bez wybranej grupy ta osoba nie jest rozliczana i nie zajmuje miejsca w drabince rodzinnej.</p>
							) }
						</div>
					</div>

					<div className="self-start space-y-3">
						<PercentBreakdown quoted={ quoted } member={ member }/>

						<ScopeTotals gross={ gross } quoted={ quoted?.totals ?? null } title="Do zapłaty"/>
					</div>
				</div>
			</section>

			{ onRemove !== null && (
				<button
					type="button"
					onClick={ onRemove }
					title="Usuń osobę"
					aria-label={ `Usuń osobę ${ ordinal }` }
					className="absolute top-1/2 left-full ml-2 shrink-0 -translate-y-1/2 rounded-lg p-1.5 text-os-text-muted transition-colors hover:bg-os-error/10 hover:text-os-error focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none"
				>
					<Trash2 className="size-5"/>
				</button>
			) }
		</div>
	);
}


/**
 * Where this person landed in the household, and the figure that put them there.
 */
function PositionChip({ quoted }: { quoted: QuoteMember }) {
	if (!quoted.billed) {
		return <span className="shrink-0 rounded-lg border border-os-border px-2 py-0.5 text-sm text-os-text-muted ml-1">nie jest rozliczana</span>;
	}

	return (
		<Tooltip content={ FAMILY_ORDER_HINT } placement="bottom" className="shrink-0">
			<span className="inline-flex items-center gap-2 rounded-lg border border-os-primary/40 bg-os-primary/10 px-2 py-0.5 text-sm text-os-text ml-1">
				<Users aria-hidden className="size-3.5 text-os-primary"/>
				{ quoted.familyPosition }. miejsce w rodzinie
				<span className="text-os-text-muted">· podstawa { formatCurrency(quoted.monthlyBase) }</span>
				<Info aria-hidden className="size-3.5 text-os-text-muted"/>
			</span>
		</Tooltip>
	);
}


/**
 * How the percentage was arrived at.
 */
function PercentBreakdown({ quoted, member }: { quoted: QuoteMember | null; member: DraftMember }) {
	const familyLabel = quoted?.familyPosition === null || quoted === null ? 'miejsce w rodzinie' : `${ quoted.familyPosition }. miejsce w rodzinie`;
	const groupLabel = quoted === null ? 'grupy' : `${ quoted.groupCount } ${ pluralise(quoted.groupCount, 'grupa', 'grupy', 'grup') }`;
	const showsStudentDiscount = quoted?.studentDiscount ?? member.studentDiscount;
	const totalPercent = quoted?.totalPercent ?? null;

	return (
		<BreakdownCard title="Zniżka" gridClassName="grid-cols-[1fr_auto]">
			<Part percent={ quoted?.familyPercent ?? null } label={ familyLabel }/>
			<Part percent={ quoted?.groupCountPercent ?? null } label={ groupLabel }/>

			{ showsStudentDiscount && (
				<>
					<Part percent={ quoted?.studentPercent ?? null } label="student" icon={ <GraduationCap aria-hidden className="size-3.5"/> }/>
				</>
			) }

			<BreakdownDivider className="col-span-2"/>
			<span className="text-sm text-os-text">RAZEM</span>
			<span className={ cn('text-right text-base font-semibold tabular-nums', totalPercent === null ? 'text-os-text-muted' : 'text-os-green') }>
				{ totalPercent === null ? '—' : formatPercent(totalPercent) }
			</span>
		</BreakdownCard>
	);
}


function Part({ percent, label, icon }: { percent: number | null; label: string; icon?: ReactNode }) {
	return (
		<>
			<span className="inline-flex min-w-0 items-center gap-1 text-sm uppercase text-os-text-muted">
				{ icon }
				{ label }
			</span>
			<span className={ cn('shrink-0 text-right text-base tabular-nums', percent === null || percent === 0 ? 'text-os-text-muted' : 'text-os-text') }>
				{ percent === null ? '—' : formatPercent(percent) }
			</span>
		</>
	);
}


function indexLines(lines: QuoteLine[]): Map<string, QuoteLine> {
	return new Map(lines.map((line) => [line.groupId, line]));
}
