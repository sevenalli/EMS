import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header'
import Home from './pages/Home'
import PortSelection from './pages/PortSelection'
import EquipmentSelection from './pages/EquipmentSelection'
import Dashboard from './pages/Dashboard'
import EquipmentMonitoring from './pages/EquipmentMonitoring'
import TelemetryDashboard from './pages/TelemetryDashboard'
import Notifications from './pages/Notifications'
import { useStore } from './store/store'

function App() {
    const isDarkMode = useStore((state) => state.isDarkMode)
    const location = useLocation()

    // Hide header on monitoring, telemetry and notifications pages for full-screen experience
    const hideHeader = location.pathname.startsWith('/monitoring/') ||
        location.pathname.startsWith('/telemetry/') ||
        location.pathname === '/notifications'

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDarkMode])

    return (
        <div className="min-h-screen bg-gray-50">
            {!hideHeader && <Header />}
            <main className={hideHeader ? '' : 'pt-16'}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/ports" element={<PortSelection />} />
                    <Route path="/equipment-selection" element={<EquipmentSelection />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/monitoring/:equipmentId" element={<EquipmentMonitoring />} />
                    <Route path="/telemetry/:equipmentId" element={<TelemetryDashboard />} />
                    <Route path="/notifications" element={<Notifications />} />
                </Routes>
            </main>
        </div>
    )
}

export default App
