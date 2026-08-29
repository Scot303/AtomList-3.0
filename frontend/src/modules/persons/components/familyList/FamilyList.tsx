import { FamilyRow } from './FamilyRow';
import type { FamilyView } from '../../types/types.ts';


interface FamilyListProps {
	families: FamilyView[];
	canModify: boolean;
}


export const FamilyList = ({ families, canModify }: FamilyListProps) => {
	return families.length === 0 ? (
		<p className="py-6 text-center text-sm text-os-text-muted">Brak rodzin do wyświetlenia</p>
	) : (
		<ul className="space-y-3">
			{ families.map((family) => (
				<FamilyRow key={ family.id } family={ family } canModify={ canModify }/>
			)) }
		</ul>
	);
};
