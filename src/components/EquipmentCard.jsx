import { useNavigate } from 'react-router-dom'
import { useMqtt } from '../hooks/useMqtt'
import { useStore, mockData } from '../store/store'
import {
    Fuel,
    Wind,
    Weight,
    Thermometer,
    Wifi,
    WifiOff,
    PowerOff,
    Clock,
    Wrench,
    Bell,
    Zap,
    ExternalLink
} from 'lucide-react'

// Crane type images
const craneImages = {
    1: '/crane-1.png',
    2: '/crane-2.png',
    3: '/crane-3.png',
}

// Accessory images
const accessoryImages = {
    benne: '/benne.png',
    spreader: '/grabber.png',
    twinlift: '/grabber.png',
}

// Accessory labels
const accessoryLabels = {
    benne: 'Benne',
    spreader: 'Spreader',
    twinlift: 'Twinlift',
}

const EquipmentCard = ({ equipmentId, initialStatus = 'off' }) => {
    const navigate = useNavigate()
    const { telemetry, isConnected } = useMqtt(equipmentId, { useMock: true })
    const isDarkMode = useStore((state) => state.isDarkMode)

    // Get equipment details from mock data
    const equipmentData = mockData.equipment.find(eq => eq.id === equipmentId) || {}
    const { craneType = 1, accessory = 'benne', notifications = 0 } = equipmentData

    // Use equipment data status or fallback
    const status = equipmentData.status || initialStatus

    // Status configurations - Off, Standby, Affected, Maintenance
    const statusConfig = {
        off: {
            color: 'bg-gray-500',
            label: 'Off',
            labelColor: isDarkMode ? 'text-gray-400' : 'text-gray-500',
            icon: PowerOff,
            iconColor: isDarkMode ? 'text-gray-500' : 'text-gray-400',
            bgColor: isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100',
        },
        standby: {
            color: 'bg-amber-500',
            label: 'Standby',
            labelColor: 'text-amber-400',
            icon: Clock,
            iconColor: 'text-amber-500',
            bgColor: isDarkMode ? 'bg-amber-900/30' : 'bg-amber-50',
        },
        affected: {
            color: 'bg-green-500',
            label: 'Affected',
            labelColor: 'text-green-400',
            icon: Zap,
            iconColor: 'text-green-500',
            bgColor: isDarkMode ? 'bg-green-900/30' : 'bg-green-50',
        },
        maintenance: {
            color: 'bg-blue-500',
            label: 'Maintenance',
            labelColor: 'text-blue-400',
            icon: Wrench,
            iconColor: 'text-blue-500',
            bgColor: isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50',
        },
    }

    const currentStatus = statusConfig[status] || statusConfig.off
    const StatusIcon = currentStatus.icon

    // Handle card click - navigate to monitoring page
    const handleClick = () => {
        navigate(`/monitoring/${equipmentId}`)
    }

    return (
        <div
            onClick={handleClick}
            className={`rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group ${isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white shadow-sm hover:shadow-xl'
                }`}
        >
            {/* Header with Equipment ID, Status, Connection, and Notifications */}
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-100'
                }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${currentStatus.color} shadow-lg`} />
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{equipmentId}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notifications Badge */}
                    {notifications > 0 && (
                        <div className="relative flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20">
                            <Bell size={14} className="text-red-500" />
                            <span className="text-xs font-bold text-red-500">{notifications}</span>
                        </div>
                    )}
                    <span className={`text-sm font-medium ${currentStatus.labelColor}`}>
                        {currentStatus.label}
                    </span>
                    {isConnected ? (
                        <Wifi size={16} className="text-green-500" />
                    ) : (
                        <WifiOff size={16} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                    )}
                    {/* Open indicator on hover */}
                    <ExternalLink size={16} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDarkMode ? 'text-primary' : 'text-primary'}`} />
                </div>
            </div>

            {/* Crane Image & Status Section */}
            <div className={`p-4 flex items-center gap-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                {/* Crane Image */}
                <div className={`w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-white'
                    }`}>
                    <img
                        src={craneImages[craneType]}
                        alt="Crane"
                        className="w-16 h-16 object-contain"
                    />
                </div>

                {/* Status Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <StatusIcon className={currentStatus.iconColor} size={18} />
                        <span className={`text-sm font-semibold ${currentStatus.labelColor}`}>
                            {currentStatus.label}
                        </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        État de l'équipement
                    </p>
                </div>

                {/* Accessory */}
                <div className="text-center">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-1 ${isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                        <img
                            src={accessoryImages[accessory]}
                            alt={accessoryLabels[accessory]}
                            className="w-8 h-8 object-contain"
                        />
                    </div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {accessoryLabels[accessory]}
                    </span>
                </div>
            </div>

            {/* Secondary Metrics Grid */}
            <div className={`grid grid-cols-2 gap-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {/* Fuel Level */}
                <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Fuel size={16} className="text-amber-500" />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Carburant</span>
                    </div>
                    <div className="flex items-end gap-1">
                        <span className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {telemetry ? Math.round(telemetry.fuelLevel) : '—'}
                        </span>
                        <span className={`text-sm mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>%</span>
                    </div>
                    <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${telemetry?.fuelLevel > 50 ? 'bg-green-500' :
                                    telemetry?.fuelLevel > 20 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                            style={{ width: `${telemetry?.fuelLevel || 0}%` }}
                        />
                    </div>
                </div>

                {/* Load Weight */}
                <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Weight size={16} className="text-primary" />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Charge</span>
                    </div>
                    <div className="flex items-end gap-1">
                        <span className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {telemetry ? telemetry.loadWeight.toFixed(1) : '—'}
                        </span>
                        <span className={`text-sm mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>t</span>
                    </div>
                </div>

                {/* Wind Speed */}
                <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Wind size={16} className="text-cyan-500" />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Vent</span>
                    </div>
                    <div className="flex items-end gap-1">
                        <span className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {telemetry ? Math.round(telemetry.windSpeed) : '—'}
                        </span>
                        <span className={`text-sm mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>m/s</span>
                    </div>
                </div>

                {/* Temperature */}
                <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Thermometer size={16} className="text-red-500" />
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Temp. Huile</span>
                    </div>
                    <div className="flex items-end gap-1">
                        <span className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {telemetry ? telemetry.hydraulicTemp.toFixed(1) : '—'}
                        </span>
                        <span className={`text-sm mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>°C</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EquipmentCard
