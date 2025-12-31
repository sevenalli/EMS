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
    ExternalLink,
    Radio
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

const EquipmentCard = ({ equipmentId, initialStatus = 'off', isOnline = false, mqttData = null, portId = 'SMA' }) => {
    const navigate = useNavigate()

    // Build dynamic topic based on port/equipmentId format
    const dynamicTopic = `${portId}/${equipmentId}`

    const { telemetry: mqttTelemetry, isConnected } = useMqtt(equipmentId, {
        useMock: false,
        topic: dynamicTopic
    })

    // Use passed mqttData if available, otherwise use from hook
    const telemetry = mqttData || mqttTelemetry

    const isDarkMode = useStore((state) => state.isDarkMode)

    // Get equipment details from mock data
    const equipmentData = mockData.equipment.find(eq => eq.id === equipmentId) || {}
    const { craneType = 1, notifications = 0 } = equipmentData

    // Determine accessory type from telemetry (priority: twinlift > spreader > benne)
    const getAccessoryFromTelemetry = () => {
        if (!telemetry) return equipmentData.accessory || 'benne'

        // Check twinlift first (higher priority) - using multiple possible field names
        if (telemetry.twinliftConnected || telemetry.twinlift) return 'twinlift'
        // Then check spreader
        if (telemetry.spreaderConnected || telemetry.spreader) return 'spreader'
        // Default to benne (motor grab)
        return 'benne'
    }

    const accessory = getAccessoryFromTelemetry()

    // Determine status from telemetry
    const getStatusFromTelemetry = () => {
        if (!telemetry) return equipmentData.status || initialStatus

        // Check if diesel engine is running (crane is on)
        const dieselRunning = telemetry.dieselEnMarche || telemetry.dieselRunning
        // Check if main switch is on
        const mainSwitchOn = telemetry.kranHauptschalter || telemetry.mainSwitch

        // If diesel is running, crane is active/affected
        if (dieselRunning) {
            return 'affected'
        }

        // If main switch is on but diesel not running, standby
        if (mainSwitchOn) {
            return 'standby'
        }

        // Otherwise off
        return 'off'
    }

    const status = getStatusFromTelemetry()

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
            label: 'Active',
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
                    {/* Online status indicator with pulse */}
                    <div className="relative">
                        <div className={`w-3 h-3 rounded-full ${isOnline || isConnected ? 'bg-green-500' : currentStatus.color} shadow-lg`} />
                        {(isOnline || isConnected) && (
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-30" />
                        )}
                    </div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{equipmentId}</h3>
                </div>
                <div className="flex items-center gap-3">
                    {/* Online badge when streaming */}
                    {(isOnline || isConnected) && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20">
                            <Radio size={12} className="text-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-500">LIVE</span>
                        </div>
                    )}
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
                    {isOnline || isConnected ? (
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
                            {telemetry?.fuelLevel != null && !isNaN(telemetry.fuelLevel) ? Math.round(telemetry.fuelLevel) : '—'}
                        </span>
                        <span className={`text-sm mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>%</span>
                    </div>
                    <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${(telemetry?.fuelLevel || 0) > 50 ? 'bg-green-500' :
                                (telemetry?.fuelLevel || 0) > 20 ? 'bg-amber-500' : 'bg-red-500'
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
                            {telemetry?.loadWeight != null && !isNaN(telemetry.loadWeight) ? telemetry.loadWeight.toFixed(1) : '—'}
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
                            {telemetry?.windSpeed != null && !isNaN(telemetry.windSpeed) ? Math.round(telemetry.windSpeed) : '—'}
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
                            {telemetry?.hydraulicTemp != null && !isNaN(telemetry.hydraulicTemp) ? telemetry.hydraulicTemp.toFixed(1) : '—'}
                        </span>
                        <span className={`text-sm mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>°C</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EquipmentCard
