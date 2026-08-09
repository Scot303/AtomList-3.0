import { useState } from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { dataTableStrings } from '@/components/dataTable';
import { VALUELESS_OPERATORS } from '../config/filterOperators';
import { getRandomTagColor } from '../config/tagColors';
import type { AdvancedFilterRule, AdvancedFilterTag, FilterableColumn } from '../types/filterTypes';
import { validateExpression } from '../utils/expressionParser';
import { AdvancedRuleBuilder } from './AdvancedRuleBuilder';
import { FilterColorRow } from './FilterColorRow';


interface AdvancedFilterFormProps {
	filterableColumns: FilterableColumn[];
	initial?: AdvancedFilterTag;
	/** True when an advanced filter already exists, and this is not it. */
	blocked: boolean;
	maxRules?: number;
	onSubmit: (tag: AdvancedFilterTag) => void;
	submitLabel: string;
}


export const AdvancedFilterForm = (props: AdvancedFilterFormProps) => {
	const { filterableColumns, initial, blocked, maxRules, onSubmit, submitLabel } = props;

	const [rules, setRules] = useState<AdvancedFilterRule[]>(initial?.rules ?? [emptyRule()]);
	const [expression, setExpression] = useState(initial?.customExpression ?? '');
	const [color, setColor] = useState(initial?.color ?? getRandomTagColor());

	const expressionError = validateExpression(expression, rules.length);

	const canSubmit = rules.length > 0
		&& rules.every((rule) => rule.field !== ''
			&& rule.operator !== ''
			&& (VALUELESS_OPERATORS.has(rule.operator) || rule.values.length > 0))
		&& expressionError === null;

	const submit = () => {
		if (!canSubmit) {
			return;
		}

		onSubmit({
			id: initial?.id ?? crypto.randomUUID(),
			mode: 'advanced',
			rules,
			customExpression: expression.trim() || undefined,
			color,
		});
	};

	if (blocked) {
		return (
			<div className="p-4">
				<div className="flex items-center gap-2 rounded-lg border border-os-border bg-os-bg p-3 text-xs text-os-text-muted">
					<Info size={ 14 } className="shrink-0"/>
					{ dataTableStrings.filter.advancedAlreadyExists }
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4 p-4">
			<AdvancedRuleBuilder
				rules={ rules }
				onChange={ setRules }
				filterableColumns={ filterableColumns }
				customExpression={ expression }
				onExpressionChange={ setExpression }
				expressionError={ expressionError }
				maxRules={ maxRules }
			/>

			<hr className="mt-3 border-os-border"/>

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


function emptyRule(): AdvancedFilterRule {
	return { id: crypto.randomUUID(), field: '', operator: '', values: [] };
}
