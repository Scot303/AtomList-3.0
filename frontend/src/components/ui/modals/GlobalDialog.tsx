import { Fragment } from 'react';
import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild, } from '@headlessui/react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { useCloseOnNavigate } from '@/hooks/useCloseOnNavigate';
import { cn } from '@/lib/cn';
import { type DialogVariant, useDialogStore } from '@/stores/dialogStore';


const VARIANTS: Record<DialogVariant, { icon: typeof Info; iconColor: string; buttonVariant: 'danger' | 'warning' | 'primary' }> = {
	danger: { icon: AlertTriangle, iconColor: 'text-os-error', buttonVariant: 'danger' },
	warning: { icon: AlertCircle, iconColor: 'text-os-warning', buttonVariant: 'warning' },
	info: { icon: Info, iconColor: 'text-os-primary', buttonVariant: 'primary' },
};


/**
 * The one confirmation dialog on the page, sitting a layer above {@link GlobalModal} so a modal can raise one over itself.
 */
export function GlobalDialog() {
	const {
		isOpen,
		isConfirming,
		title,
		message,
		confirmText,
		cancelText,
		variant,
		showCancel,
		confirmDialog,
		closeDialog,
		resetDialog,
	} = useDialogStore();

	useCloseOnNavigate(closeDialog);

	const { icon: Icon, iconColor, buttonVariant } = VARIANTS[variant];

	return (
		<Transition show={ isOpen } as={ Fragment } afterLeave={ resetDialog }>
			<Dialog onClose={ closeDialog } className="relative z-10000">
				<TransitionChild
					as={ Fragment }
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<DialogBackdrop className="fixed inset-0 bg-black/20 backdrop-blur-sm"/>
				</TransitionChild>

				<div className="fixed inset-0 flex items-center justify-center p-4">
					<TransitionChild
						as={ Fragment }
						enter="ease-out-soft duration-300"
						enterFrom="opacity-0 scale-95"
						enterTo="opacity-100 scale-100"
						leave="ease-in duration-200"
						leaveFrom="opacity-100 scale-100"
						leaveTo="opacity-0 scale-95"
					>
						<DialogPanel
							className="popover-surface w-full max-w-md rounded-2xl p-6 pb-5 shadow-2xl transition-[opacity,scale] duration-200 will-change-[opacity,scale] motion-reduce:transition-none">
							<div className="flex items-start gap-4">
								<div className={ cn('shrink-0 pt-px', iconColor) }>
									<Icon size={ 24 } aria-hidden/>
								</div>

								<div className="min-w-0 flex-1">
									<DialogTitle className="mb-2 text-lg font-semibold text-os-text">
										{ title }
									</DialogTitle>

									<Description className="themed-scrollbar max-h-[50dvh] overflow-y-auto whitespace-pre-line text-sm wrap-break-word text-os-text-muted">
										{ message }
									</Description>
								</div>
							</div>

							<div className="mt-6 flex justify-end gap-3">
								{ showCancel ? (
									<Button
										variant="secondary_muted"
										size="md"
										disabled={ isConfirming }
										onClick={ closeDialog }
									>
										{ cancelText }
									</Button>
								) : null }

								<Button
									variant={ buttonVariant }
									size="md"
									isLoading={ isConfirming }
									onClick={ () => void confirmDialog() }
								>
									{ confirmText }
								</Button>
							</div>
						</DialogPanel>
					</TransitionChild>
				</div>
			</Dialog>
		</Transition>
	);
}
