import { useState } from 'react';
import { CheckCircle2, MailWarning } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Alert } from '@/components/feedback/Alert.tsx';
import { Button } from '@/components/ui/buttons/Button.tsx';
import { Spinner } from '@/components/feedback/Spinner.tsx';
import { Input } from '@/components/ui/fields/Input.tsx';
import { paths } from '@/routes/paths';
import { AuthLayout } from '../components/AuthLayout';
import { useEmailVerification, useResendVerification } from '../hooks/useAuthMutations';


export function VerifyEmailPage() {
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') ?? '';

	if (token.length === 0) {
		return (
			<AuthLayout title="Brak tokenu potwierdzenia">
				<Alert tone="danger">
					Ten adres nie zawiera tokenu potwierdzenia. Otwórz link dokładnie tak, jak przyszedł w wiadomości e-mail.
				</Alert>
				<BackToLogin/>
			</AuthLayout>
		);
	}

	return <VerificationOutcome token={ token }/>;
}


function VerificationOutcome({ token }: { token: string }) {
	const verify = useEmailVerification(token);

	if (verify.isSuccess) {
		return (
			<AuthLayout title="Adres e-mail potwierdzony">
				<div className="flex flex-col items-center gap-4 text-center">
					<CheckCircle2 className="size-10 text-os-green"/>
					<p className="text-base text-os-text-muted mb-5">
						Możesz się teraz zalogować - poprosimy o jednorazowy kod wysłany na ten adres.
					</p>
					<Link to={ paths.login }>Przejdź do logowania</Link>
				</div>
			</AuthLayout>
		);
	}

	if (verify.isError) {
		return (
			<AuthLayout title="Nie udało się potwierdzić adresu">
				<div className="space-y-5">
					<Alert tone="danger" title="Link jest nieaktualny">
						{ verify.error.message }
					</Alert>

					<ResendVerificationForm/>

					<BackToLogin/>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout title="Potwierdzamy adres e-mail">
			<div className="flex flex-col items-center gap-4 py-4">
				<Spinner size="lg" className="text-os-primary" label={ null }/>
				<p className="text-base text-os-text-muted">Chwileczkę…</p>
			</div>
		</AuthLayout>
	);
}

/** A fresh link, for when the one in the mailbox has expired or was already used. */
function ResendVerificationForm() {
	const [identifier, setIdentifier] = useState('');
	const resend = useResendVerification();

	if (resend.isSuccess) {
		return (
			<Alert tone="success">
				Jeśli konto istnieje i czeka na potwierdzenie, wysłaliśmy nowy link. Sprawdź skrzynkę, łącznie z folderem ze spamem.
			</Alert>
		);
	}

	return (
		<form
			onSubmit={ (event) => {
				event.preventDefault();

				if (identifier.trim().length > 0) {
					resend.mutate(identifier.trim());
				}
			} }
			className="space-y-3"
		>
			<Input
				label="Poproś o nowy link"
				placeholder="Login lub adres e-mail"
				value={ identifier }
				onChange={ (event) => setIdentifier(event.target.value) }
				autoComplete="username"
				disabled={ resend.isPending }
			/>

			{ resend.isError ? <Alert tone="danger">{ resend.error.message }</Alert> : null }

			<Button
				type="submit"
				variant="secondary"
				className="w-full mt-5"
				isLoading={ resend.isPending }
				disabled={ identifier.trim().length === 0 }
				leftIcon={ <MailWarning size={ 20 }/> }
			>
				Wyślij nowy link
			</Button>
		</form>
	);
}

function BackToLogin() {
	return (
		<p className="mt-10 text-center text-base text-os-text-muted">
			<Link
				to={ paths.login }
				className="rounded text-os-primary hover:text-os-text focus-visible:ring-2 focus-visible:ring-os-primary/40 focus-visible:outline-none"
			>
				Wróć do logowania
			</Link>
		</p>
	);
}
