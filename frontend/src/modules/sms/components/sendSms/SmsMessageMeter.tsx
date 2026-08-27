import { cn } from '@/lib/cn';
import { pluralise } from '@/lib/locale';
import { countSegments, isGsmEncodable } from '../../utils/smsSegments.ts';


interface SmsMessageMeterProps {
	message: string;
	maxLength: number;
}


/**
 * What the message costs as it is typed.
 */
export function SmsMessageMeter({ message, maxLength }: SmsMessageMeterProps) {
	const length = message.length;
	const segments = countSegments(message);
	const unicode = message !== '' && !isGsmEncodable(message);

	return (
		<div className="space-y-1 px-2">
			<div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-os-text-muted">
				<span className={ cn('tabular-nums', length > maxLength && 'text-os-error') }>
					{ length }/{ maxLength } znaków
				</span>

				{ segments > 0 && (
					<span className="tabular-nums">
						Treść mieści się w { segments } { pluralise(segments, 'SMS', 'SMSach', 'SMSach') }
					</span>
				) }
			</div>

			<div className="min-h-5">
				{ unicode && (
					<p className="text-sm text-os-warning">
						Polskie znaki skracają jedną część SMS ze 160 do 70 znaków.
					</p>
				) }
			</div>
		</div>
	);
}
