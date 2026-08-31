import { useState } from 'react';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Tabs } from '@/components/ui/tabs/TabPanel';
import { cn } from '@/lib/cn';
import { dataTableStrings } from '@/components/dataTable';
import type { AdvancedFilterTag, FilterableColumn, FilterActiveTag, FilterTag } from '../types/filterTypes';
import { AdvancedFilterForm } from './AdvancedFilterForm';
import { SimpleFilterForm } from './SimpleFilterForm';

const SIMPLE_TAB = 0;
const ADVANCED_TAB = 1;

interface FilterTagPopoverProps {
	/** The tag being edited. Undefined means a new one is being built. */
	tag?: FilterActiveTag;
	filterableColumns: FilterableColumn[];
	/** True when some advanced filter exists - only one is allowed at a time. */
	hasAdvancedFilter: boolean;
	maxAdvancedRules?: number;
	onSubmit: (tag: FilterActiveTag) => void;
	onClose: () => void;
}

/**
 * The editor behind both the "add filter" button and an existing tag.
 *
 * Each tab's draft state lives in its own form component, so switching tabs starts the other kind of
 * filter clean rather than carrying half of the previous one across.
 */
export const FilterTagPopover = (props: FilterTagPopoverProps) => {
	const { tag, filterableColumns, hasAdvancedFilter, maxAdvancedRules, onSubmit, onClose } = props;

	const editingAdvanced = tag?.mode === 'advanced';
	const [activeTab, setActiveTab] = useState(editingAdvanced ? ADVANCED_TAB : SIMPLE_TAB);

	const submitLabel = tag ? dataTableStrings.filter.save : dataTableStrings.filter.add;

	const submit = (next: FilterActiveTag) => {
		onSubmit(next);
		onClose();
	};

	return (
		<div
			className={ cn(
				'popover-surface overflow-hidden rounded-xl transition-[width] duration-150',
				activeTab === ADVANCED_TAB ? 'w-200' : 'w-100',
			) }
		>
			<Tabs
				spacing="none"
				selectedIndex={ activeTab }
				onChange={ setActiveTab }
				tabs={ [
					{
						label: dataTableStrings.filter.tabSimple,
						icon: <Filter size={ 16 }/>,
						content: (
							<SimpleFilterForm
								filterableColumns={ filterableColumns }
								initial={ tag?.mode === 'simple' ? (tag as FilterTag) : undefined }
								onSubmit={ submit }
								submitLabel={ submitLabel }
							/>
						),
					},
					{
						label: dataTableStrings.filter.tabAdvanced,
						icon: <SlidersHorizontal size={ 16 }/>,
						content: (
							<AdvancedFilterForm
								filterableColumns={ filterableColumns }
								initial={ editingAdvanced ? (tag as AdvancedFilterTag) : undefined }
								blocked={ hasAdvancedFilter && !editingAdvanced }
								maxRules={ maxAdvancedRules }
								onSubmit={ submit }
								submitLabel={ submitLabel }
							/>
						),
					},
				] }
			/>
		</div>
	);
};
