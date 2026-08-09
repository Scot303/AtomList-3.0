import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { TagSelect } from '@/components/ui/tags';
import { Input } from '@/components/ui/fields/Input';
import { DatePicker } from '@/components/ui/fields/DatePicker';
import type { SelectSize } from '@/components/ui/select';
import { dataTableStrings } from '@/components/dataTable';
import type { FilterableColumn } from '../types/filterTypes';


interface FilterValueInputProps {
	column: FilterableColumn | undefined;
	/** Always an array: tag columns hold several ids, everything else uses index 0. */
	values: string[];
	onChange: (values: string[]) => void;
	size?: SelectSize;
	/** Shown instead of the field's own label when there is no room for one, as in a rule row. */
	label?: string;
}

/**
 * The right control for whatever the chosen column holds.
 */
export const FilterValueInput = (props: FilterValueInputProps) => {
	const { column, values, onChange, size = 'default', label } = props;

	const fieldType = column?.fieldType ?? 'text';
	const fieldLabel = label ?? dataTableStrings.filter.fieldValue;
	const single = values[0] ?? '';

	const setSingle = (value: string | undefined) => onChange(value ? [value] : []);

	switch (fieldType) {
		case 'tag':
			return (
				<TagSelect
					multiple
					size={ size }
					label={ size === 'sm' ? undefined : fieldLabel }
					placeholder={ fieldLabel }
					options={ column?.tagOptions ?? [] }
					value={ values }
					onChange={ onChange }
					searchable
					clearable
				/>
			);

		case 'select':
			return (
				<ExtendedSelect
					size={ size }
					label={ size === 'sm' ? undefined : fieldLabel }
					placeholder={ fieldLabel }
					options={ column?.selectOptions ?? [] }
					value={ single || undefined }
					onChange={ setSingle }
					clearable
				/>
			);

		case 'boolean':
			return (
				<ExtendedSelect
					size={ size }
					label={ size === 'sm' ? undefined : fieldLabel }
					placeholder={ fieldLabel }
					searchable={ false }
					options={ BOOLEAN_OPTIONS }
					value={ single || undefined }
					onChange={ setSingle }
				/>
			);

		case 'date':
			return (
				<DatePicker
					size={ size }
					label={ size === 'sm' ? '' : dataTableStrings.filter.fieldDate }
					value={ single }
					onChange={ setSingle }
				/>
			);

		case 'number':
			return (
				<Input
					type="number"
					size={ size }
					label={ fieldLabel }
					placeholder={ fieldLabel }
					value={ single }
					onChange={ (event) => setSingle(event.target.value) }
				/>
			);

		default:
			return (
				<Input
					size={ size }
					label={ fieldLabel }
					placeholder={ fieldLabel }
					value={ single }
					onChange={ (event) => setSingle(event.target.value) }
				/>
			);
	}
};

const BOOLEAN_OPTIONS = [
	{ id: 'true', name: 'Tak' },
	{ id: 'false', name: 'Nie' },
];
