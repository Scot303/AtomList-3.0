import { useState } from 'react'
import { LogIn, MailCheck, RotateCcw } from 'lucide-react'

import { ErrorCode } from '@/api/errors'
import { Alert } from '@/components/feedback/Alert.tsx'
import { Button } from '@/components/ui/buttons/Button.tsx'

import { LOGIN_CODE_LENGTH, LOGIN_CODE_RESEND_COOLDOWN_SECONDS, LOGIN_CODE_TTL_MINUTES, normalizeLoginCode, } from '../constants'
import { useCountdown } from '@/hooks/useCountdown.ts'
import { useRequestLoginCode, useVerifyLoginCode } from '../hooks/useAuthMutations'
import { loginCodeSchema } from '../schemas/authSchemas'

import { OtpCodeInput } from './OtpCodeInput'
import { ResendVerificationNotice } from './ResendVerificationNotice'

interface CodeStepProps {
	identifier: string
	codeRequestedAt: number | null
	onCodeResent: () => void
	onChangeIdentifier: () => void
	onSignedIn: () => void
}

export function CodeStep({ identifier, codeRequestedAt, onCodeResent, onChangeIdentifier, onSignedIn, }: CodeStepProps) {

	const [code, setCode] = useState('');
	const [validationError, setValidationError] = useState<string | null>(null);

	const verify = useVerifyLoginCode(onSignedIn);
	const resend = useRequestLoginCode();

	const cooldownDeadline = codeRequestedAt === null ? null : codeRequestedAt + LOGIN_CODE_RESEND_COOLDOWN_SECONDS * 1000;
	const secondsUntilResend = useCountdown(cooldownDeadline);

	const submit = (submitted: string) => {
		const parsed = loginCodeSchema.safeParse({ code: submitted });

		if (!parsed.success) {
			setValidationError(parsed.error.issues[0]?.message ?? 'Nieprawidłowy kod.');

			return;
		}

		setValidationError(null);
		verify.mutate({ identifier, code: normalizeLoginCode(submitted) });
	}

	const handleChange = (next: string) => {
		setCode(next);

		if (validationError !== null) {
			setValidationError(null);
		}

		if (verify.isError) {
			verify.reset();
		}
	}

	const emailUnverified = verify.error?.is(ErrorCode.emailNotVerified) === true;
	const errorMessage = validationError ?? (emailUnverified ? null : (verify.error?.message ?? null));

	return (
		<form
			onSubmit={ (event) => {
				event.preventDefault()
				submit(code)
			} }
			noValidate
			className="space-y-5"
		>
			<div>
				<OtpCodeInput
					value={ code }
					onChange={ handleChange }
					onComplete={ submit }
					disabled={ verify.isPending }
					invalid={ errorMessage !== null }
					autoFocus
				/>

				<p className="mt-2 text-sm leading-relaxed text-os-text-muted">
					Wielkość liter ma znaczenie. Możesz wkleić cały kod naraz - spacje zostaną pominięte.
				</p>
			</div>

			{ errorMessage !== null ?
				<Alert tone="danger">{ errorMessage }</Alert>
				:
				<Alert tone="info" title="Sprawdź swoją skrzynkę pocztową">
					Na podany login wysłaliśmy { LOGIN_CODE_LENGTH }-znakowy kod ważny przez{ ' ' } { LOGIN_CODE_TTL_MINUTES } minut.
				</Alert>
			}

			{ emailUnverified ? (
				<ResendVerificationNotice identifier={ identifier } message={ verify.error?.message }/>
			) : null }

			<Button
				type="submit"
				className="w-full"
				isLoading={ verify.isPending }
				disabled={ code.length < LOGIN_CODE_LENGTH }
				size="lg"
				leftIcon={ <LogIn size={ 18 }/> }
			>
				Zaloguj się
			</Button>

			<div className="flex items-center justify-between gap-3 text-sm mt-2 px-1">
				<button
					type="button"
					onClick={ onChangeIdentifier }
					className="text-os-text-muted transition-colors hover:text-os-text"
				>
					Użyj innego loginu
				</button>

				<button
					type="button"
					disabled={ secondsUntilResend > 0 || resend.isPending }
					onClick={ () => resend.mutate(identifier, { onSuccess: onCodeResent }) }
					className="inline-flex items-center gap-1.5 text-os-text-muted transition-colors hover:text-os-text disabled:cursor-not-allowed"
				>
					{ resend.isSuccess && secondsUntilResend > 0 ? (
						<MailCheck className="size-3.5"/>
					) : (
						<RotateCcw className="size-3.5"/>
					) }
					{ secondsUntilResend > 0 ? `Wyślij ponownie za ${ secondsUntilResend }s` : 'Wyślij kod ponownie' }
				</button>
			</div>

			{ resend.isError ? <Alert tone="danger">{ resend.error.message }</Alert> : null }
		</form>
	);
}
