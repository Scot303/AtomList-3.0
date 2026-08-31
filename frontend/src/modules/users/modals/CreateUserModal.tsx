import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { ExtendedSelect } from '@/components/ui/extendedSelect';
import { Input } from '@/components/ui/fields/Input';
import { TagSelect } from '@/components/ui/tags';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import type { Permission, Role } from '@/types/auth';
import { PERMISSION_OPTIONS, ROLE_OPTIONS } from '../types/constants.ts';
import { useCreateUser } from '../hooks/useAdminUserMutations';
import { type CreateUserFormValues, createUserSchema } from '../schemas/userSchemas';


export default function CreateUserModal() {
	const closeModal = useModalStore((state) => state.closeModal);
	const createUser = useCreateUser();

	const { register, control, handleSubmit, formState: { errors } } = useForm<CreateUserFormValues>({
		resolver: zodResolver(createUserSchema),
		defaultValues: {
			username: '',
			email: '',
			role: 'BASIC',
			additionalPermissions: [],
		},
	});

	const onSubmit = handleSubmit((values) => {
		createUser.mutate(values, {
			onSuccess: (user) => {
				notifySuccess(`Konto ${ user.username } zostało utworzone.`);
				closeModal();
			},
		});
	});

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-1 space-y-4">
			<Input
				label="Login"
				autoFocus
				autoComplete="off"
				spellCheck={ false }
				maxLength={ 64 }
				disabled={ createUser.isPending }
				error={ errors.username?.message }
				{ ...register('username') }
			/>

			<Input
				label="Adres e-mail"
				type="email"
				autoComplete="off"
				spellCheck={ false }
				maxLength={ 255 }
				disabled={ createUser.isPending }
				error={ errors.email?.message }
				{ ...register('email') }
			/>

			<Controller
				control={ control }
				name="role"
				render={ ({ field }) => (
					<TagSelect
						label="Rola"
						options={ ROLE_OPTIONS }
						searchable={ false }
						value={ field.value }
						onChange={ (value) => {
							if (value !== undefined) {
								field.onChange(value as Role);
							}
						} }
						onBlur={ field.onBlur }
						disabled={ createUser.isPending }
						error={ errors.role?.message }
					/>
				) }
			/>

			<Controller
				control={ control }
				name="additionalPermissions"
				render={ ({ field }) => (
					<ExtendedSelect
						multiple
						label="Dodatkowe uprawnienia"
						options={ PERMISSION_OPTIONS }
						clearable
						placeholder="Brak"
						value={ field.value }
						onChange={ (values) => field.onChange(values as Permission[]) }
						onBlur={ field.onBlur }
						disabled={ createUser.isPending }
						error={ errors.additionalPermissions?.message }
					/>
				) }
			/>

			{ createUser.isError ? (
				<Alert tone="danger" className="mt-5">
					{ createUser.error.message }
				</Alert>
			) : (
				<Alert tone="info" className="mt-5">
					Link weryfikacyjny zostanie wysłany automatycznie.
				</Alert>
			) }

			<div className="flex justify-end gap-3 pt-1">
				<Button
					type="button"
					variant="secondary_muted"
					size="md"
					disabled={ createUser.isPending }
					onClick={ closeModal }
				>
					Anuluj
				</Button>

				<Button type="submit" size="md" isLoading={ createUser.isPending } leftIcon={ <UserPlus size={ 16 }/> }>
					Utwórz konto
				</Button>
			</div>
		</form>
	);
}
