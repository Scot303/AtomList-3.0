import { useQuery } from '@tanstack/react-query';
import { Alert } from '@/components/feedback/Alert';
import { Spinner } from '@/components/feedback/Spinner';
import { Button } from '@/components/ui/buttons/Button';
import { useModalStore } from '@/stores/modalStore';
import { fetchCurrentUser } from '../api/authApi';
import { authKeys } from '../api/authKeys';


export default function AccountModal() {
	const closeModal = useModalStore((state) => state.closeModal);

	const { data, isPending, isError, error } = useQuery({
		queryKey: authKeys.me(),
		queryFn: fetchCurrentUser,
		staleTime: 5 * 60_000,
	});

	if (isPending) {
		return (
			<div className="flex justify-center py-10">
				<Spinner size="lg" className="text-os-primary"/>
			</div>
		);
	}

	if (isError) {
		return <Alert tone="danger">{ error.message }</Alert>;
	}

	return (
		<div className="space-y-10 mt-5">
			<dl className="space-y-3 text-sm">
				<Row label="Login" value={ data.username }/>
				<Row label="Adres e-mail" value={ data.email }/>
			</dl>

			<div>
				<p className="mb-2 text-xs tracking-wide text-os-text-muted uppercase">
					Uprawnienia
				</p>

				{ data.permissions.length === 0 ? (
					<p className="text-sm text-os-text-muted">
						Twoje konto nie ma jeszcze żadnych uprawnień.
					</p>
				) : (
					<ul className="flex flex-wrap gap-1.5">
						{ data.permissions.map((permission) => (
							<li
								key={ permission }
								className="rounded-lg border border-os-border px-2 py-1 font-mono text-[0.6875rem] text-os-text-muted"
							>
								{ permission }
							</li>
						)) }
					</ul>
				) }
			</div>

			<div className="flex justify-end pt-1">
				<Button variant="secondary" size="md" onClick={ closeModal }>
					Zamknij
				</Button>
			</div>
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-baseline justify-between gap-4">
			<dt className="shrink-0 text-os-text-muted">{ label }</dt>
			<dd className="min-w-0 truncate text-os-text">{ value }</dd>
		</div>
	);
}
