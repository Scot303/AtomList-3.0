import type { KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Trash2, UserMinus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Input, Textarea } from '@/components/ui/fields';
import { Tooltip } from '@/components/ui/tooltip/Tooltip';
import { notifyApiError, notifySuccess } from '@/lib/toast';
import { useConfirm } from '@/stores/dialogStore';
import { PhoneField } from '../PhoneField';
import { useDeleteFamily, useSetFamilyMembers, useUpdateFamily } from '../../hooks/useFamilyMutations';
import { familyFormSchema, type FamilyFormValues } from '../../schemas/familySchemas';
import { toFamilyPayload } from '../../utils/familyForm';
import type { FamilyMemberView, FamilyView } from '../../types/types.ts';
import { formatPhone } from '../../utils/personFormat';


interface FamilyEditPanelProps {
	family: FamilyView;
	onClose: () => void;
}


export const FamilyEditPanel = ({ family, onClose }: FamilyEditPanelProps) => {
	const confirm = useConfirm();

	const updateFamily = useUpdateFamily();
	const setMembers = useSetFamilyMembers();
	const deleteFamily = useDeleteFamily();

	const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FamilyFormValues>({
		resolver: zodResolver(familyFormSchema),
		mode: 'onTouched',
		defaultValues: {
			name: family.name,
			phone: formatPhone(family.phone),
			note: family.note ?? '',
		},
	});

	const busy = updateFamily.isPending || setMembers.isPending || deleteFamily.isPending;

	const failure = updateFamily.error ?? setMembers.error ?? deleteFamily.error;


	const save = handleSubmit((values) => {
		if (!isDirty) {
			return;
		}

		updateFamily.mutate(
			{ id: family.id, payload: toFamilyPayload(values) },
			{
				onSuccess: (updated) => {
					notifySuccess('Zapisano zmiany.');

					reset({ name: updated.name, phone: formatPhone(updated.phone), note: updated.note ?? '' });
				},
			},
		);
	});


	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const target = event.target;

		if (event.key !== 'Enter' || target instanceof HTMLTextAreaElement || target instanceof HTMLButtonElement) {
			return;
		}

		event.preventDefault();

		void save();
	};


	const handleRemoveMember = async (member: FamilyMemberView) => {
		const confirmed = await confirm({
			title: 'Usunąć osobę z rodziny?',
			message: `${ member.fullName } przestanie należeć do rodziny ${ family.name }. \n\n Zniżka rodzinna zostanie przeliczona dla wszystkich jej członków, a otwarte listy przeliczone.`,
			confirmText: 'Usuń z rodziny',
			variant: 'warning',
		});

		if (!confirmed) {
			return;
		}

		setMembers.mutate(
			{
				id: family.id,
				personIds: family.members.filter((candidate) => candidate.id !== member.id).map((candidate) => candidate.id),
			},
			{
				onSuccess: () => notifySuccess(`${ member.fullName } nie należy już do tej rodziny.`),
				onError: notifyApiError,
			},
		);
	};


	const handleDelete = async () => {
		const confirmed = await confirm({
			title: 'Usunąć rodzinę?',
			message: `Rodzina ${ family.name } zniknie razem ze swoim numerem kontaktowym i notatką z systemu.`,
			confirmText: 'Usuń',
			variant: 'danger',
		});

		if (!confirmed) {
			return;
		}

		deleteFamily.mutate(family.id, {
			onSuccess: () => {
				notifySuccess('Rodzina została usunięta.');
				onClose();
			},
			onError: notifyApiError,
		});
	};


	return (
		<div
			onKeyDown={ handleKeyDown }
			className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-os-primary popover-surface shadow-xl"
		>
			<div className="themed-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
				<div className="grid gap-3 sm:grid-cols-2">
					<Input
						label="Nazwa"
						autoComplete="off"
						maxLength={ 128 }
						disabled={ busy }
						error={ errors.name?.message }
						{ ...register('name') }
					/>

					<PhoneField registration={ register('phone') } disabled={ busy } error={ errors.phone?.message }/>
				</div>

				<Textarea
					label="Notatka"
					maxLength={ 512 }
					minRows={ 2 }
					disabled={ busy }
					error={ errors.note?.message }
					{ ...register('note') }
				/>

				<MemberList
					members={ family.members }
					busy={ busy }
					onRemove={ (member) => void handleRemoveMember(member) }
				/>

				{ failure !== null && <Alert tone="danger">{ failure.message }</Alert> }
			</div>

			<div className="flex shrink-0 items-center justify-end gap-3 border-t border-os-border p-3">
				<DeleteAction memberCount={ family.members.length } busy={ busy } onDelete={ () => void handleDelete() }/>

				<Button
					type="button"
					size="md"
					isLoading={ busy }
					disabled={ !isDirty }
					leftIcon={ <Save size={ 16 }/> }
					onClick={ () => void save() }
				>
					Zapisz zmiany
				</Button>
			</div>
		</div>
	);
};


function MemberList({ members, busy, onRemove }: { members: FamilyMemberView[]; busy: boolean; onRemove: (member: FamilyMemberView) => void }) {
	return (
		<div className="space-y-2">
			<p className="px-1 text-sm font-semibold tracking-wide text-os-primary">Osoby w rodzinie</p>

			{ members.length === 0 ? (
				<p className="px-1 text-sm text-os-text-muted">Nikt jeszcze nie należy do tej rodziny.</p>
			) : (
				<ul className="space-y-2">
					{ members.map((member) => (
						<li
							key={ member.id }
							className="flex items-center justify-between gap-3 rounded-xl border border-os-border bg-os-surface px-3 py-1.5"
						>
							<span className="min-w-0 truncate text-sm text-os-text">
								{ member.fullName }
								{ !member.active && <span className="ml-2 text-xs text-os-text-muted">nieaktywna</span> }
							</span>

							<Button
								type="button"
								variant="ghost"
								size="md"
								disabled={ busy }
								leftIcon={ <UserMinus size={ 14 }/> }
								onClick={ () => onRemove(member) }
							>
								Usuń z rodziny
							</Button>
						</li>
					)) }
				</ul>
			) }
		</div>
	);
}


function DeleteAction({ memberCount, busy, onDelete }: { memberCount: number; busy: boolean; onDelete: () => void }) {
	const button = (
		<Button
			type="button"
			variant="danger"
			size="md"
			disabled={ busy || memberCount > 0 }
			leftIcon={ <Trash2 size={ 16 }/> }
			onClick={ onDelete }
		>
			Usuń rodzinę
		</Button>
	);

	if (memberCount === 0) {
		return button;
	}

	return (
		<Tooltip content="Najpierw usuń z rodziny wszystkie osoby." focusable={ false }>
			{ button }
		</Tooltip>
	);
}
