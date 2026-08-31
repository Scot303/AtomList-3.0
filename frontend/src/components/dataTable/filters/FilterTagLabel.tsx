import { Fragment } from 'react';
import { dataTableStrings } from '@/components/dataTable';
import { getOperatorBadgeLabel } from '../config/filterOperators';
import type { AdvancedFilterTag, FilterableColumn, FilterTag } from '../types/filterTypes';


/** How many rules an advanced filter is summarizing. */
export const AdvancedFilterLabel = ({ tag }: { tag: AdvancedFilterTag }) => (
	<span className="text-os-text-muted">{ dataTableStrings.filter.advancedBadge(tag.rules.length) }</span>
);


interface FilterLabelProps {
	tag: FilterTag;
	filterableColumns: FilterableColumn[];
}


/** A simple filter read back as a phrase. */
export const FilterLabel = ({ tag, filterableColumns }: FilterLabelProps) => {
	const { field, operator, values } = tag;

	const column = filterableColumns.find((candidate) => candidate.id === field);
	const fieldLabel = column?.label ?? field;
	const fieldType = column?.fieldType ?? 'text';

	const optionName = (id: string) =>
		column?.tagOptions?.find((option) => option.id === id)?.name
		?? column?.selectOptions?.find((option) => option.id === id)?.name
		?? id;

	if (operator === 'is_empty' || operator === 'is_not_empty') {
		return (
			<>
				{ fieldLabel }: <span className="text-os-text-muted">{ getOperatorBadgeLabel(operator) }</span>
			</>
		);
	}

	if (operator === 'tag_is_any_of') {
		return <>{ fieldLabel }: { values.map(optionName).join(', ') }</>;
	}

	if (operator === 'tag_is_none_of') {
		return (
			<>
				{ fieldLabel }:{ ' ' }
				{ values.map((value, index) => (
					<Fragment key={ value }>
						{ index > 0 && ', ' }
						<span className="text-os-text-muted">{ dataTableStrings.filter.notPrefix }</span>
						{ optionName(value) }
					</Fragment>
				)) }
			</>
		);
	}

	const raw = values[0] ?? '';
	const shown = raw === ''
		? ''
		: fieldType === 'select'
			? optionName(raw)
			: fieldType === 'boolean'
				? (raw === 'true' ? 'Tak' : 'Nie')
				: fieldType === 'text'
					? `"${ raw }"`
					: raw;

	return (
		<>
			{ fieldLabel }: <span className="text-os-text-muted">{ getOperatorBadgeLabel(operator) }</span> { shown }
		</>
	);
};
