import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Alert } from '@/components/feedback/Alert.tsx';
import { Button } from '@/components/ui/buttons/Button.tsx';
import { Input } from '@/components/ui/fields/Input.tsx';
import { useRequestLoginCode } from '../hooks/useAuthMutations';
import { type IdentifierFormValues, identifierSchema } from '../schemas/authSchemas';

interface IdentifierStepProps {
	defaultIdentifier?: string;
	onCodeRequested: (identifier: string) => void;
}

/**
 * Step one: who is signing in.
 * The backend answers 202 to every request here, so that this form cannot be used to find out which usernames exist.
 */
export function IdentifierStep({ defaultIdentifier = '', onCodeRequested }: IdentifierStepProps) {
	const requestCode = useRequestLoginCode();

	const { register, handleSubmit, formState: { errors } } = useForm<IdentifierFormValues>({
		resolver: zodResolver(identifierSchema),
		defaultValues: { identifier: defaultIdentifier },
	});

	const onSubmit = handleSubmit(({ identifier }) => {
		requestCode.mutate(identifier, {
			onSuccess: () => onCodeRequested(identifier),
		});
	});

	return (
		<form onSubmit={ onSubmit } noValidate className="space-y-8">
			<div className="mt-8">
				<Input
					label="Login lub adres e-mail"
					icon={ <User size={ 18 }/> }
					autoComplete="username"
					autoFocus
					disabled={ requestCode.isPending }
					error={ errors.identifier?.message }
					{ ...register('identifier') }
				/>
			</div>

			{ requestCode.isError ? <Alert tone="danger">{ requestCode.error.message }</Alert> : null }

			<Button
				type="submit"
				isLoading={ requestCode.isPending }
				className="w-full"
				size="lg"
				leftIcon={ <ArrowRight size={ 18 }/> }
			>
				Wyślij kod logowania
			</Button>
		</form>
	);
}
