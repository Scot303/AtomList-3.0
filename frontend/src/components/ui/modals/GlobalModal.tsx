import { Fragment } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import { useCloseOnNavigate } from '@/hooks/useCloseOnNavigate';
import { cn } from '@/lib/cn';
import { loadedModals, MODAL_REGISTRY, type ModalSize, type ModalSizePreset, type ModalViewportHeight, resolveModalTitle } from '@/stores/modalRegistry.ts';
import { useModalStore } from '@/stores/modalStore';
import { ModalBody } from './ModalBody';


const SIZES: Record<ModalSizePreset, string> = {
	sm: 'max-w-sm',
	md: 'max-w-md',
	lg: 'max-w-2xl',
	xl: 'max-w-4xl',
};


function maxWidthClass(size: ModalSize): string {
	return Object.hasOwn(SIZES, size) ? SIZES[size as ModalSizePreset] : size;
}


function viewportHeight(value: ModalViewportHeight | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}

	const percent = Number.parseFloat(value);

	return Number.isFinite(percent) ? `${ Math.min(Math.max(percent, 0), 100) }dvh` : undefined;
}


/**
 * The one modal on the page. Mounted once, near the root; everything else opens it through `useModalStore().openModal(key, props)`.
 */
export function GlobalModal() {
	const isOpen = useModalStore((state) => state.isOpen);
	const current = useModalStore((state) => state.current);
	const closeModal = useModalStore((state) => state.closeModal);
	const resetModal = useModalStore((state) => state.resetModal);

	useCloseOnNavigate(closeModal);


	const definition = current === null ? null : MODAL_REGISTRY[current.key];

	// `options.title` first, so a `setModalTitle` from inside the modal wins over the registry's.
	const title = current === null ? '' : current.options.title ?? resolveModalTitle(current.key, current.props);

	const size = current?.options.size ?? definition?.size ?? 'md';

	const height = viewportHeight(current?.options.height ?? definition?.height);
	const maxHeight = viewportHeight(current?.options.maxHeight ?? definition?.maxHeight);

	const dismissible = current?.options.dismissible ?? definition?.dismissible ?? true;

	const Content = current === null ? undefined : loadedModals[current.key];

	const onDismiss = () => {
		if (dismissible) {
			closeModal();
		}
	};

	return (
		<Transition show={ isOpen } as={ Fragment } afterLeave={ resetModal }>
			<Dialog onClose={ onDismiss } className="relative z-1500">
				<TransitionChild as={ Fragment } enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
					<DialogBackdrop className="fixed inset-0 bg-black/20 backdrop-blur-sm"/>
				</TransitionChild>

				<div className="fixed inset-0 flex items-center justify-center">
					<TransitionChild
						as={ Fragment }
						enter="ease-out duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<DialogPanel
							style={ { height, maxHeight } }
							className={ cn(
								'popover-surface relative flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-3xl shadow-2xl will-change-transform',
								'transition-[max-width,transform,border-color,box-shadow] duration-200 motion-reduce:transition-none',
								maxWidthClass(size),
								current?.options.className,
							) }
						>
							<div className="shrink-0 p-8 pr-16 pb-4">
								<DialogTitle className="text-xl font-bold wrap-break-word text-os-text">{ title }</DialogTitle>
							</div>

							{ dismissible ? (
								<button
									type="button"
									onClick={ closeModal }
									aria-label="Zamknij"
									className="absolute top-4 right-4 rounded-xl p-2 text-os-text-muted transition-all hover:bg-os-bg-highlight hover:text-os-error focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none"
								>
									<X size={ 20 } aria-hidden/>
								</button>
							) : null }

							<ModalBody key={ current?.key }>
								{ Content && current ? <Content { ...current.props } /> : null }
							</ModalBody>
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	);
}
