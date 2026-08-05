import type { ReactNode } from 'react'

import logo from '@public/atomlisticon.png'


interface AuthLayoutProps {
	title: string;
	subtitle?: ReactNode;
	children: ReactNode;
}


export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
	return (
		<div className="flex min-h-dvh items-center justify-center">
			<div className="w-full max-w-md">
				<div className="mb-7 flex flex-col items-center gap-3 -mt-20">
					<img
						src={ logo }
						alt=""
						className="size-25 rounded-2xl shadow-glow"
					/>
					<h1 className="text-4xl font-bold text-os-text tracking-widest uppercase antialiased">AtomList</h1>
				</div>

				<div className="popover-surface p-8">
					<div className="text-center">
						<h1 className="text-2xl font-bold uppercase">{ title }</h1>
						{ subtitle ?
							<p className="mt-2 text-sm ">{ subtitle }</p>
							:
							<div className="mb-8"></div>
						}
					</div>

					<div className="mt-5">{ children }</div>
				</div>
			</div>
		</div>
	);
}
