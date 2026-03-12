import { useStore } from '../../store/store'

/**
 * Telemetry Widget Components
 * Reusable widgets for displaying telemetry data in various formats
 */

// Digital display with value and unit
export function DigitalWidget({
    label,
    value,
    unit,
    icon: Icon,
    iconColor = 'text-blue-500',
    size = 'md',
    className = ''
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)

    const displayValue = value != null && !isNaN(value)
        ? (typeof value === 'number' ? value.toFixed(1) : value)
        : '—'

    const sizeClasses = {
        sm: 'p-2',
        md: 'p-3',
        lg: 'p-4'
    }

    const valueClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl'
    }

    return (
        <div className={`rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} ${sizeClasses[size]} ${className}`}>
            <div className="flex items-center gap-2 mb-1">
                {Icon && <Icon size={16} className={iconColor} />}
                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {label}
                </span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`font-bold font-mono ${valueClasses[size]} ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    {displayValue}
                </span>
                {unit && (
                    <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {unit}
                    </span>
                )}
            </div>
        </div>
    )
}

// Boolean indicator (on/off status)
export function BooleanWidget({
    label,
    value,
    icon: Icon,
    activeColor = 'bg-green-500',
    inactiveColor = 'bg-gray-500',
    className = ''
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)
    const isActive = value === true || value === 'true' || value === 1 || value === '1'

    return (
        <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} ${className}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Icon && (
                        <Icon
                            size={16}
                            className={isActive ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}
                        />
                    )}
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {label}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={`w-3 h-3 rounded-full ${isActive ? activeColor : inactiveColor} ${isActive ? 'shadow-lg shadow-green-500/50' : ''}`}
                        role="status"
                        aria-label={isActive ? 'Active' : 'Inactive'}
                    />
                    <span className={`text-xs font-semibold ${isActive
                            ? 'text-green-500'
                            : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                        {isActive ? 'ON' : 'OFF'}
                    </span>
                </div>
            </div>
        </div>
    )
}

// Vertical bar indicator
export function VerticalBarWidget({
    label,
    value,
    unit = '%',
    min = 0,
    max = 100,
    thresholds = { warning: 75, danger: 90 },
    height = 100,
    className = ''
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)

    const safeValue = value != null && !isNaN(value) ? value : 0
    const percentage = Math.max(0, Math.min(100, ((safeValue - min) / (max - min)) * 100))

    const getColor = () => {
        if (safeValue >= thresholds.danger) return 'bg-red-500'
        if (safeValue >= thresholds.warning) return 'bg-amber-500'
        return 'bg-green-500'
    }

    return (
        <div className={`rounded-xl p-3 text-center ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} ${className}`}>
            <div className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {label}
            </div>
            <div
                className={`relative w-8 mx-auto rounded-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                style={{ height }}
            >
                <div
                    className={`absolute bottom-0 w-full transition-all duration-300 rounded-full ${getColor()}`}
                    style={{ height: `${percentage}%` }}
                />
            </div>
            <div className={`mt-2 font-bold font-mono ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {safeValue.toFixed(0)}{unit}
            </div>
        </div>
    )
}

// Fuel tank indicator
export function FuelTankWidget({
    label = 'Fuel Level',
    value,
    className = ''
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)
    const safeValue = value != null && !isNaN(value) ? value : 0

    const getColor = () => {
        if (safeValue > 50) return 'bg-green-500'
        if (safeValue > 20) return 'bg-amber-500'
        return 'bg-red-500'
    }

    return (
        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} ${className}`}>
            <div className={`text-xs font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {label}
            </div>

            {/* Tank shape */}
            <div className="relative w-16 h-24 mx-auto">
                {/* Tank body */}
                <div className={`absolute inset-0 rounded-lg border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} overflow-hidden`}>
                    <div
                        className={`absolute bottom-0 w-full transition-all duration-500 ${getColor()}`}
                        style={{ height: `${safeValue}%` }}
                    />
                </div>
                {/* Tank cap */}
                <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 rounded-t-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`} />
            </div>

            <div className={`mt-3 text-center font-bold font-mono text-xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {safeValue.toFixed(0)}%
            </div>
        </div>
    )
}

// Thermometer indicator
export function ThermometerWidget({
    label,
    value,
    unit = '°C',
    min = 0,
    max = 100,
    thresholds = { warning: 70, danger: 85 },
    className = ''
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)

    const safeValue = value != null && !isNaN(value) ? value : 0
    const percentage = Math.max(0, Math.min(100, ((safeValue - min) / (max - min)) * 100))

    const getColor = () => {
        if (safeValue >= thresholds.danger) return '#ef4444' // red
        if (safeValue >= thresholds.warning) return '#f97316' // orange
        return '#22c55e' // green
    }

    return (
        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} ${className}`}>
            <div className={`text-xs font-medium mb-3 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {label}
            </div>

            {/* Thermometer */}
            <div className="flex items-center justify-center gap-3">
                <div className="relative">
                    {/* Tube */}
                    <div className={`w-4 h-20 rounded-t-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden relative`}>
                        <div
                            className="absolute bottom-0 w-full transition-all duration-300"
                            style={{ height: `${percentage}%`, backgroundColor: getColor() }}
                        />
                    </div>
                    {/* Bulb */}
                    <div
                        className="w-6 h-6 rounded-full -mt-1 mx-auto"
                        style={{ backgroundColor: getColor() }}
                    />
                </div>

                {/* Value */}
                <div>
                    <div className={`font-bold font-mono text-2xl ${isDarkMode ? 'text-white' : 'text-gray-800'}`} style={{ color: getColor() }}>
                        {safeValue.toFixed(1)}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{unit}</div>
                </div>
            </div>
        </div>
    )
}

// Odometer display (for counters)
export function OdometerWidget({
    label,
    value,
    unit,
    digits = 6,
    className = ''
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)
    const safeValue = value != null && !isNaN(value) ? Math.floor(value) : 0
    const valueStr = safeValue.toString().padStart(digits, '0')

    return (
        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'} ${className}`}>
            <div className={`text-xs font-medium mb-3 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {label}
            </div>

            <div className="flex justify-center gap-0.5">
                {valueStr.split('').map((digit, i) => (
                    <div
                        key={i}
                        className={`w-6 h-9 flex items-center justify-center rounded font-mono text-lg font-bold ${isDarkMode
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-800 text-white'
                            }`}
                    >
                        {digit}
                    </div>
                ))}
            </div>

            {unit && (
                <div className={`text-xs text-center mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {unit}
                </div>
            )}
        </div>
    )
}

export default {
    DigitalWidget,
    BooleanWidget,
    VerticalBarWidget,
    FuelTankWidget,
    ThermometerWidget,
    OdometerWidget
}
