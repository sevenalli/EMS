import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary'

// Note: MqttProvider is removed from here to avoid connection errors when no broker is available
// It can be added back when MQTT broker is configured, or imported where needed

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </BrowserRouter>
    </StrictMode>,
)
