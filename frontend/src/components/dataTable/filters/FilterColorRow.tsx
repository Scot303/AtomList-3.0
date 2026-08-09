import { useState } from 'react';
import { ColorPicker } from '@/components/ui/fields/ColorPicker';
import { dataTableStrings } from '@/components/dataTable';
import { toHexColor } from '../config/tagColors';


interface FilterColorRowProps {
	value: string;
	onChange: (color: string) => void;
}


export const FilterColorRow = ({ value, onChange }: FilterColorRowProps) => {
	const [picking, setPicking] = useState(false);

	if (picking) {
		return (
			<ColorPicker
				label={ dataTableStrings.filter.fieldColor }
				size="sm"
				placeholder={ dataTableStrings.filter.fieldColor }
				value={ value }
				onChange={ onChange }
			/>
		);
	}

	return (
		<div className="flex items-center gap-3 px-2">
			<span
				aria-hidden
				className="h-5 w-5 shrink-0 rounded-md border-2 border-os-border"
				style={ value
					? { backgroundColor: toHexColor(value) }
					: { background: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(128,128,128,0.2) 3px, rgba(128,128,128,0.2) 6px)' }
				}
			/>

			<span className="flex-1 text-sm text-os-text-muted">{ dataTableStrings.filter.colorRandom }</span>

			<button
				type="button"
				onClick={ () => setPicking(true) }
				className="text-sm font-medium text-os-primary outline-none hover:underline focus-visible:underline"
			>
				{ dataTableStrings.filter.colorChange }
			</button>
		</div>
	);
};
