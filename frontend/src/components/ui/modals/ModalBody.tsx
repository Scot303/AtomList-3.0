import type { ReactNode } from 'react';
import { useContentHeight } from '@/hooks/useContentHeight';


interface ModalBodyProps {
	children: ReactNode;
}


export function ModalBody({ children }: ModalBodyProps) {
	const { ref, height } = useContentHeight<HTMLDivElement>();

	return (
		<div className="themed-scrollbar min-h-0 flex-1 overflow-y-auto">
			<div
				style={ { height } }
				className="overflow-hidden transition-[height] duration-200 ease-out motion-reduce:transition-none"
			>
				<div ref={ ref } className="px-8 pb-8">
					{ children }
				</div>
			</div>
		</div>
	);
}
