import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/fields/Input';
import { notifySuccess } from '@/lib/toast';
import { useModalStore } from '@/stores/modalStore';
import { useUpdateUser } from '../hooks/useAdminUserMutations';
import { type EditUserFormValues, editUserSchema } from '../schemas/userSchemas';
import type { UpdateUserPayload } from '../types/types.ts';

interface EditUserModalProps {
	userId: string;
	username: string;
	email: string;
}

const USERNAME_NOTICE = 'Zmiana loginu zakończy wszystkie sesje tego konta.';

const EMAIL_NOTICE = 'Nowy adres wymaga potwierdzenia. Do czasu potwierdzenia konto nie będzie mogło się zalogować, a wszystkie sesje zostaną zakończone.';

/**
 * Edits an account's login and address.
 */
export default function EditUserModal({ userId, username, email }: EditUserModalProps) {
	const closeModal = useModalStore((state) => state.closeModal);
	const updateUser = useUpdateUser();

	const { register, control, handleSubmit, formState: { errors } } = useForm<EditUserFormValues>({
		resolver: zodResolver(editUserSchema),
		defaultValues: { username, email },
	});

	// Watched rather than checked on submit, so what a change costs is said before it is made.
	const [enteredUsername, enteredEmail] = useWatch({ control, name: ['username', 'email'] });

	const usernameChanged = enteredUsername.trim() !== username;
	const emailChanged = enteredEmail.trim() !== email;

	const onSubmit = handleSubmit((values) => {
		const payload: UpdateUserPayload = {
			...(values.username !== username && { username: values.username }),
			...(values.email !== email && { email: values.email }),
		};

		if (Object.keys(payload).length === 0) {
			closeModal();
			return;
		}

		updateUser.mutate(
			{ id: userId, payload },
			{
				onSuccess: () => {
					notifySuccess('Zapisano zmiany.');
					closeModal();
				},
			},
		);
	});

	return (
		<form onSubmit={ onSubmit } noValidate className="mt-2 space-y-5">
			<Input
				label="Login"
				autoFocus
				autoComplete="off"
				spellCheck={ false }
				maxLength={ 64 }
				disabled={ updateUser.isPending }
				error={ errors.username?.message }
				{ ...register('username') }
			/>

			<Input
				label="Adres e-mail"
				type="email"
				autoComplete="off"
				spellCheck={ false }
				maxLength={ 255 }
				disabled={ updateUser.isPending }
				error={ errors.email?.message }
				{ ...register('email') }
			/>

			{ usernameChanged && <Alert tone="warning">{ USERNAME_NOTICE }</Alert> }

			{ emailChanged && <Alert tone="warning">{ EMAIL_NOTICE }</Alert> }

			{ updateUser.isError && <Alert tone="danger">{ updateUser.error.message }</Alert> }

			<div className="flex justify-end gap-3 pt-1">
				<Button
					type="button"
					variant="secondary_muted"
					size="md"
					disabled={ updateUser.isPending }
					onClick={ closeModal }
				>
					Anuluj
				</Button>

				<Button type="submit" size="md" isLoading={ updateUser.isPending } leftIcon={ <Save size={ 16 }/> }>
					Zapisz
				</Button>
			</div>
		</form>
	);
}
