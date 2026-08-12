import { Plus, X } from 'lucide-react';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { Input } from '@/components/ui/fields/Input';
import { cn } from '@/lib/cn';
import { dataTableStrings } from '@/components/dataTable';
import { getOperatorsForFieldType, VALUELESS_OPERATORS } from '../config/filterOperators';
import { DEFAULT_MAX_ADVANCED_RULES } from '../config/filterLimits';
import type { AdvancedFilterRule, FilterableColumn, FilterOperator, RuleLogic } from '../types/filterTypes';
import type { ExpressionErrorCode } from '../utils/expressionParser';
import { FilterValueInput } from './FilterValueInput';


interface AdvancedRuleBuilderProps {
	rules: AdvancedFilterRule[];
	onChange: (rules: AdvancedFilterRule[]) => void;
	filterableColumns: FilterableColumn[];
	customExpression: string;
	onExpressionChange: (expression: string) => void;
	expressionError: ExpressionErrorCode | null;
	maxRules?: number;
}


export const AdvancedRuleBuilder = (props: AdvancedRuleBuilderProps) => {
	const {
		rules,
		onChange,
		filterableColumns,
		customExpression,
		onExpressionChange,
		expressionError,
		maxRules = DEFAULT_MAX_ADVANCED_RULES,
	} = props;

	const hasExpression = customExpression.trim() !== '';

	const updateRule = (id: string, patch: Partial<AdvancedFilterRule>) =>
		onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));

	const addRule = () =>
		onChange([...rules, { id: crypto.randomUUID(), field: '', operator: '', values: [], logicBefore: 'AND' }]);

	const removeRule = (id: string) => {
		if (hasExpression) {
			onExpressionChange('');
		}

		onChange(rules.filter((rule) => rule.id !== id));
	};

	const columnOptions = filterableColumns.map((column) => ({ id: column.id, name: column.label }));

	return (
		<div className="flex flex-col gap-2">
			<div
				className="themed-scrollbar flex flex-col gap-2 overflow-y-auto"
				style={ { maxHeight: 'clamp(12rem, 40dvh, 24rem)' } }
			>
				{ rules.map((rule, index) => {
					const column = filterableColumns.find((candidate) => candidate.id === rule.field);
					const operators = column ? getOperatorsForFieldType(column.fieldType) : [];
					const takesValue = Boolean(rule.field && rule.operator) && !VALUELESS_OPERATORS.has(rule.operator);

					return (
						<div key={ rule.id } className="flex flex-col gap-1.5">
							{ index > 0 && (
								<div role="radiogroup" aria-label="Łącznik" className="ml-7 flex items-center gap-1">
									{ (['AND', 'OR'] as const).map((logic) => (
										<LogicButton
											key={ logic }
											logic={ logic }
											selected={ rule.logicBefore === logic }
											// The expression replaces these outright, so leaving them live would suggest they still did something.
											disabled={ hasExpression }
											onClick={ () => updateRule(rule.id, { logicBefore: logic }) }
										/>
									)) }
								</div>
							) }

							<div className="flex items-center gap-1.5 px-1 py-1">
								<span aria-hidden className="mr-1 shrink-0 select-none text-base font-bold text-os-text-muted">
									{ index + 1 }
								</span>

								<div className="min-w-0 flex-1">
									<ExtendedSelect
										size="sm"
										placeholder={ dataTableStrings.filter.fieldColumn }
										options={ columnOptions }
										value={ rule.field || undefined }
										onChange={ (field) => updateRule(rule.id, {
											field: field ?? '',
											operator: '',
											values: [],
										}) }
									/>
								</div>

								<div className="min-w-0 flex-1">
									<ExtendedSelect
										size="sm"
										searchable={ false }
										disabled={ !rule.field }
										placeholder={ dataTableStrings.filter.fieldCondition }
										options={ operators }
										value={ rule.operator || undefined }
										onChange={ (operator) => updateRule(rule.id, {
											operator: (operator ?? '') as FilterOperator | '',
											values: [],
										}) }
									/>
								</div>

								<div className="min-w-0 flex-1">
									{ takesValue ? (
										<FilterValueInput
											size="sm"
											column={ column }
											values={ rule.values }
											onChange={ (values) => updateRule(rule.id, { values }) }
										/>
									) : (
										<Input label="" size="sm" value="" disabled readOnly/>
									) }
								</div>

								{ rules.length > 1 && (
									<button
										type="button"
										aria-label={ `${ dataTableStrings.sort.remove } ${ index + 1 }` }
										onClick={ () => removeRule(rule.id) }
										className="ml-2 shrink-0 rounded-xl p-1 text-os-text-muted transition-colors outline-none hover:text-os-error focus-visible:text-os-error"
									>
										<X size={ 18 }/>
									</button>
								) }
							</div>
						</div>
					);
				}) }

				{ rules.length < maxRules && (
					<div className="px-1 pt-1">
						<button
							type="button"
							onClick={ addRule }
							className="flex items-center gap-1.5 px-1 py-1 text-sm text-os-text-muted transition-colors outline-none hover:text-os-text focus-visible:text-os-text"
						>
							<Plus size={ 14 }/>
							{ dataTableStrings.filter.addRule }
						</button>
					</div>
				) }
			</div>

			{ rules.length >= 2 && (
				<div className="mt-5 flex flex-col gap-1.5">
					<Input
						size="sm"
						label={ dataTableStrings.filter.expression.label }
						placeholder={ dataTableStrings.filter.expression.placeholder }
						value={ customExpression }
						onChange={ (event) => onExpressionChange(event.target.value) }
						error={ expressionError ? dataTableStrings.filter.error[expressionError] : undefined }
					/>

					<span className="ml-1 text-sm text-os-text-muted">
						{ dataTableStrings.filter.expression.hint }
					</span>
				</div>
			) }
		</div>
	);
};


interface LogicButtonProps {
	logic: RuleLogic;
	selected: boolean;
	disabled: boolean;
	onClick: () => void;
}

const LogicButton = ({ logic, selected, disabled, onClick }: LogicButtonProps) => (
	<button
		type="button"
		role="radio"
		aria-checked={ selected }
		disabled={ disabled }
		onClick={ onClick }
		className={ cn(
			'rounded border px-2 py-0.5 text-xs font-bold transition-colors outline-none',
			disabled
				? 'cursor-not-allowed border-os-border text-os-text-muted/40'
				: selected
					? 'border-os-primary/40 bg-os-primary/15 text-os-primary'
					: 'border-os-border text-os-text-muted hover:bg-os-border/20 hover:text-os-text/80',
		) }
	>
		{ dataTableStrings.filter.logic[logic] }
	</button>
);
