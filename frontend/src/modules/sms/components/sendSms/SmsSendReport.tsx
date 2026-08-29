import { CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/feedback/Alert';
import { pluralise } from '@/lib/locale';
import { SKIP_REASON_NAMES } from '../../types/smsRows.ts';
import type { SmsSendResultView } from '../../types/types.ts';


interface SmsSendReportProps {
	result: SmsSendResultView;
}


export function SmsSendReport({ result }: SmsSendReportProps) {
	const segments = result.sent.reduce((total, sms) => total + sms.segments, 0);

	return (
		<div className="space-y-3">
			<Alert tone="success" contentClassName="text-sm">
				<span className="inline-flex items-center gap-2">
					<CheckCircle2 className="size-4 shrink-0"/>
					Wysłano { result.sent.length } { pluralise(result.sent.length, 'wiadomość', 'wiadomości', 'wiadomości') }
					{ ' ' }(poprzez { segments } { pluralise(segments, 'płatny SMS', 'płatnych SMSów', 'płatnych SMSów') }).
				</span>
			</Alert>

			<Alert tone="warning" title={ `Pominięto w wysyłce (${ result.skipped.length })` } contentClassName="text-sm">
				<ul className="space-y-0.5">
					{ result.skipped.map((recipient) => (
						<li key={ recipient.personId }>
							{ recipient.fullName } — { SKIP_REASON_NAMES[recipient.reason] }
						</li>
					)) }
				</ul>
			</Alert>
		</div>
	);
}
