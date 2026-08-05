import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { installAuthBridge } from '@/modules/auth/session'

import App from './App.tsx'
import './styles/index.css'

// Before anything renders, so no request can leave while the API client still has no way to reach the token.
installAuthBridge();

const container = document.getElementById('root');

if (container === null) {
	throw new Error('No #root element in index.html to mount into.');
}

createRoot(container).render(
	<StrictMode>
		<App/>
	</StrictMode>,
)
