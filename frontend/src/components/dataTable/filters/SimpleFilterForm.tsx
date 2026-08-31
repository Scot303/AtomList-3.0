import { useState } from 'react';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { Button } from '@/components/ui/buttons/Button';
import { dataTableStrings } from '@/components/dataTable';
import { getOperatorsForFieldType, VALUELESS_OPERATORS } from '../config/filterOperators';
import { getRandomTagColor } from '../config/tagColors';
import type { FilterableColumn, FilterOperator, FilterTag } from '../types/filterTypes';
import { FilterColorRow } from './FilterColorRow';
import { FilterValueInput } from './FilterValueInput';


interface SimpleFilterFormProps {
	filterableColumns: FilterableColumn[];
	/** The tag being edited or undefined when building a new one. */
	initial?: FilterTag;
	onSubmit: (tag: FilterTag) => void;
	submitLabel: string;
}


/** One field, one condition, one value. */
export const SimpleFilterForm = ({ filterableColumns, initial, onSubmit, submitLabel }: SimpleFilterFormProps) => {
	const [field, setField] = useState(initial?.field ?? '');
	const [operator, setOperator] = useState<FilterOperator | ''>(initial?.operator ?? '');
	const [values, setValues] = useState<string[]>(initial ? [...initial.values] : []);
	const [color, setColor] = useState(initial?.color ?? getRandomTagColor());

	const column = filterableColumns.find((candidate) => candidate.id === field);
	const operators = column ? getOperatorsForFieldType(column.fieldType) : [];
	const takesValue = operator !== '' && !VALUELESS_OPERATORS.has(operator);

	const canSubmit = field !== '' && operator !== '' && (!takesValue || values.length > 0);

	const changeField = (next: string) => {
		const previousType = column?.fieldType;
		const nextType = filterableColumns.find((candidate) => candidate.id === next)?.fieldType;

		setField(next);

		// An operator only survives a field change while the new field takes the same ones.
		if (previousType !== nextType) {
			setOperator('');
			setValues([]);
		}
	};

	const submit = () => {
		if (!canSubmit) {
			return;
		}

		onSubmit({
			id: initial?.id ?? crypto.randomUUID(),
			mode: 'simple',
			field,
			operator: operator as FilterOperator,
			values: takesValue ? values : [],
			color,
		});
	};

	return (
		<div className="flex flex-col gap-4 p-4">
			<ExtendedSelect
				label={ dataTableStrings.filter.fieldColumn }
				placeholder={ dataTableStrings.filter.selectPlaceholder }
				options={ filterableColumns.map((candidate) => ({ id: candidate.id, name: candidate.label })) }
				value={ field || undefined }
				onChange={ (next) => changeField(next ?? '') }
			/>

			{ field !== '' && (
				<ExtendedSelect
					label={ dataTableStrings.filter.fieldCondition }
					placeholder={ dataTableStrings.filter.selectPlaceholder }
					searchable={ false }
					options={ operators }
					value={ operator || undefined }
					onChange={ (next) => {
						setOperator((next ?? '') as FilterOperator);
						setValues([]);
					} }
				/>
			) }

			{ field !== '' && takesValue && (
				<FilterValueInput column={ column } values={ values } onChange={ setValues }/>
			) }

			<hr className="mt-6 border-os-border"/>

			<FilterColorRow value={ color } onChange={ setColor }/>

			<Button
				type="button"
				variant="primary"
				size="md"
				className="w-full"
				disabled={ !canSubmit }
				onClick={ submit }
			>
				{ submitLabel }
			</Button>
		</div>
	);
};
