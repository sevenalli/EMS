import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Wifi, WifiOff, AlertTriangle, Wrench, Activity } from 'lucide-react'

// Status configuration
const STATUS_CONFIG = {
    active: {
        color: '#10B981',
        bgColor: 'bg-emerald-500',
        ringColor: 'ring-emerald-500/50',
        label: 'Active',
        Icon: Activity
    },
    affected: {
        color: '#3B82F6',
        bgColor: 'bg-blue-500',
        ringColor: 'ring-blue-500/50',
        label: 'Affected',
        Icon: Wifi
    },
    standby: {
        color: '#F59E0B',
        bgColor: 'bg-amber-500',
        ringColor: 'ring-amber-500/50',
        label: 'Standby',
        Icon: WifiOff
    },
    off: {
        color: '#64748B',
        bgColor: 'bg-slate-500',
        ringColor: 'ring-slate-500/50',
        label: 'Off',
        Icon: WifiOff
    },
    maintenance: {
        color: '#EF4444',
        bgColor: 'bg-red-500',
        ringColor: 'ring-red-500/50',
        label: 'Maintenance',
        Icon: Wrench
    }
}

// Create custom icon
function createCraneIcon(status, isSelected) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.off
    const size = isSelected ? 48 : 40
    const pulseSize = isSelected ? 64 : 52

    const html = `
        <div class="crane-marker ${isSelected ? 'selected' : ''}" style="width: ${pulseSize}px; height: ${pulseSize}px;">
            ${status === 'active' ? `
                <div class="crane-marker-pulse" style="
                    position: absolute;
                    inset: 0;
                    border-radius: 50%;
                    background: ${config.color}40;
                    animation: crane-pulse 2s ease-in-out infinite;
                "></div>
            ` : ''}
            <div class="crane-marker-inner" style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: ${size}px;
                height: ${size}px;
                background: linear-gradient(135deg, ${config.color} 0%, ${config.color}CC 100%);
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 20px ${config.color}60, 
                            0 2px 8px rgba(0,0,0,0.3),
                            inset 0 2px 4px rgba(255,255,255,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            ">
                <img 
                    src="/crane-1.png" 
                    alt="Crane"
                    style="
                        width: ${size * 0.7}px;
                        height: ${size * 0.7}px;
                        object-fit: contain;
                    "
                />
            </div>
            ${isSelected ? `
                <div style="
                    position: absolute;
                    bottom: -8px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 10px solid ${config.color};
                    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
                "></div>
            ` : ''}
        </div>
    `

    return L.divIcon({
        html,
        className: 'crane-custom-marker',
        iconSize: [pulseSize, pulseSize + (isSelected ? 10 : 0)],
        iconAnchor: [pulseSize / 2, pulseSize / 2 + (isSelected ? 10 : 0)],
        popupAnchor: [0, -pulseSize / 2 - 10]
    })
}

export default function CraneMarker({
    equipment,
    position,
    isSelected,
    onClick,
    onOpenMonitoring,
    isDarkMode
}) {
    const status = equipment.status || 'off'
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.off
    const StatusIcon = config.Icon

    return (
        <Marker
            position={position}
            icon={createCraneIcon(status, isSelected)}
            eventHandlers={{
                click: () => onClick(equipment.id)
            }}
        >
            <Popup className="crane-popup" closeButton={false}>
                <div className={`min-w-[220px] rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                    }`}>
                    {/* Header */}
                    <div className={`px-4 py-3 ${config.bgColor}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-sm">
                                {equipment.id}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
                                <StatusIcon size={12} />
                                {config.label}
                            </span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-4 space-y-3">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {equipment.name}
                        </p>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className={`text-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Type
                                </div>
                                <div className="text-sm font-medium capitalize">
                                    {equipment.categoryId?.replace('-', ' ') || 'Unknown'}
                                </div>
                            </div>
                            <div className={`text-center p-2 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                }`}>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Alerts
                                </div>
                                <div className={`text-sm font-medium ${equipment.notifications > 0 ? 'text-red-500' : 'text-green-500'
                                    }`}>
                                    {equipment.notifications || 0}
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={() => onOpenMonitoring(equipment.id)}
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                        >
                            <Activity size={16} />
                            Open Monitoring
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    )
}
