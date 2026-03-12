import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import {
    ChevronLeft,
    Menu,
    MapPin,
    Activity,
    Wifi,
    WifiOff,
    Wrench,
    X,
    ExternalLink
} from 'lucide-react'
import { useStore, mockData } from '../store/store'
import { useTranslation } from 'react-i18next'

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

// Import map components
import CraneMarker from '../components/map/CraneMarker'
import MapSidebar from '../components/map/MapSidebar'
import MapControls from '../components/map/MapControls'

// Port center coordinates (SMA Port)
const PORT_CENTER = [33.60684488635452, -7.599297046208311]
const DEFAULT_ZOOM = 16

// Equipment locations with real coordinates around the port
const EQUIPMENT_LOCATIONS = {
    'MM1GM11701': { lat: 33.60720, lng: -7.59950 },
    'G380003': { lat: 33.60680, lng: -7.59880 },
    'G380004': { lat: 33.60650, lng: -7.59820 },
    'G380005': { lat: 33.60710, lng: -7.59780 },
    'P450001': { lat: 33.60600, lng: -7.59950 },
    'C220001': { lat: 33.60640, lng: -7.60020 },
    'RS100001': { lat: 33.60750, lng: -7.59900 }
}

// Tile layer configurations
const TILE_LAYERS = {
    street: {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; Esri'
    },
    dark: {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }
}

// Status configuration
const STATUS_CONFIG = {
    active: { Icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Active' },
    affected: { Icon: Wifi, color: 'text-blue-500', bg: 'bg-blue-500', label: 'Affected' },
    standby: { Icon: WifiOff, color: 'text-amber-500', bg: 'bg-amber-500', label: 'Standby' },
    off: { Icon: WifiOff, color: 'text-slate-500', bg: 'bg-slate-500', label: 'Off' },
    maintenance: { Icon: Wrench, color: 'text-red-500', bg: 'bg-red-500', label: 'Maintenance' }
}

// Map style handler component
function MapStyleHandler({ mapStyle, isDarkMode }) {
    const map = useMap()

    useEffect(() => {
        // Auto-select dark tile layer when in dark mode
        // This is handled by the parent changing mapStyle
    }, [mapStyle, isDarkMode])

    return null
}

function MapView() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const isDarkMode = useStore((state) => state.isDarkMode)

    const [selectedEquipment, setSelectedEquipment] = useState(null)
    const [mapStyle, setMapStyle] = useState(isDarkMode ? 'dark' : 'street')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Sync map style with dark mode
    useEffect(() => {
        if (isDarkMode && mapStyle === 'street') {
            setMapStyle('dark')
        } else if (!isDarkMode && mapStyle === 'dark') {
            setMapStyle('street')
        }
    }, [isDarkMode])

    // Merge equipment data with locations
    const equipmentWithLocations = useMemo(() => {
        return mockData.equipment
            .filter(eq => EQUIPMENT_LOCATIONS[eq.id])
            .map(eq => ({
                ...eq,
                location: EQUIPMENT_LOCATIONS[eq.id]
            }))
    }, [])

    // Get selected equipment data
    const selectedEquipmentData = useMemo(() => {
        if (!selectedEquipment) return null
        return equipmentWithLocations.find(eq => eq.id === selectedEquipment)
    }, [selectedEquipment, equipmentWithLocations])

    // Handle equipment click
    const handleEquipmentClick = useCallback((equipmentId) => {
        setSelectedEquipment(equipmentId)
        setIsSidebarOpen(false)
    }, [])

    // Navigate to equipment monitoring
    const goToMonitoring = useCallback((equipmentId) => {
        navigate(`/monitoring/${equipmentId}`)
    }, [navigate])

    // Toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }, [])

    // Get active tile layer
    const activeTileLayer = TILE_LAYERS[mapStyle] || TILE_LAYERS.street

    return (
        <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#0a1628]' : 'bg-gray-100'
            }`}>
            {/* Header */}
            <div className={`
                relative z-[1001] px-4 py-3 flex-shrink-0
                ${isDarkMode
                    ? 'bg-gray-900/80 backdrop-blur-xl border-b border-white/10'
                    : 'bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm'
                }
            `}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className={`p-2 rounded-xl transition-colors ${isDarkMode
                                    ? 'hover:bg-white/10 text-gray-400'
                                    : 'hover:bg-gray-100 text-gray-500'
                                }`}
                            aria-label="Go back"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                                <MapPin className="text-white" size={20} />
                            </div>
                            <div>
                                <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {t('nav.map')}
                                </h1>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {equipmentWithLocations.length} equipment tracked
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Button */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className={`p-2.5 rounded-xl transition-colors ${isDarkMode
                                ? 'bg-white/10 hover:bg-white/20 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative">
                <MapContainer
                    center={PORT_CENTER}
                    zoom={DEFAULT_ZOOM}
                    className="w-full h-full"
                    zoomControl={false}
                    attributionControl={false}
                >
                    {/* Tile Layer */}
                    <TileLayer
                        key={mapStyle}
                        url={activeTileLayer.url}
                        attribution={activeTileLayer.attribution}
                    />

                    {/* Map Style Handler */}
                    <MapStyleHandler mapStyle={mapStyle} isDarkMode={isDarkMode} />

                    {/* Custom Controls */}
                    <MapControls
                        mapStyle={mapStyle}
                        onStyleChange={setMapStyle}
                        isFullscreen={isFullscreen}
                        onToggleFullscreen={toggleFullscreen}
                        isDarkMode={isDarkMode}
                    />

                    {/* Equipment Markers */}
                    {equipmentWithLocations.map(eq => (
                        <CraneMarker
                            key={eq.id}
                            equipment={eq}
                            position={[eq.location.lat, eq.location.lng]}
                            isSelected={selectedEquipment === eq.id}
                            onClick={handleEquipmentClick}
                            onOpenMonitoring={goToMonitoring}
                            isDarkMode={isDarkMode}
                        />
                    ))}
                </MapContainer>

                {/* Equipment Sidebar */}
                <MapSidebar
                    equipment={equipmentWithLocations}
                    categories={mockData.categories}
                    selectedEquipment={selectedEquipment}
                    onSelectEquipment={handleEquipmentClick}
                    onClose={() => setIsSidebarOpen(false)}
                    isOpen={isSidebarOpen}
                    isDarkMode={isDarkMode}
                />

                {/* Selected Equipment Quick Panel */}
                {selectedEquipmentData && !isSidebarOpen && (
                    <div className={`
                        absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
                        z-[1000] rounded-2xl overflow-hidden transition-all duration-300
                        ${isDarkMode
                            ? 'bg-gray-900/95 backdrop-blur-xl border border-white/10 shadow-2xl'
                            : 'bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-100'
                        }
                    `}>
                        {/* Status Header */}
                        <div className={`
                            px-4 py-3 flex items-center justify-between
                            ${STATUS_CONFIG[selectedEquipmentData.status]?.bg || 'bg-gray-500'}
                        `}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    {(() => {
                                        const Icon = STATUS_CONFIG[selectedEquipmentData.status]?.Icon || Activity
                                        return <Icon size={20} className="text-white" />
                                    })()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">
                                        {selectedEquipmentData.id}
                                    </h3>
                                    <p className="text-xs text-white/80">
                                        {STATUS_CONFIG[selectedEquipmentData.status]?.label || 'Unknown'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEquipment(null)}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                            >
                                <X size={16} className="text-white" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {selectedEquipmentData.name}
                            </p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Type', value: selectedEquipmentData.categoryId?.split('-')[0] || '—' },
                                    { label: 'Terminal', value: selectedEquipmentData.terminalId?.split('-')[1] || '—' },
                                    {
                                        label: 'Alerts',
                                        value: selectedEquipmentData.notifications || 0,
                                        isAlert: selectedEquipmentData.notifications > 0
                                    }
                                ].map(stat => (
                                    <div
                                        key={stat.label}
                                        className={`text-center p-3 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'
                                            }`}
                                    >
                                        <div className={`text-lg font-bold capitalize ${stat.isAlert ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {stat.value}
                                        </div>
                                        <div className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                            }`}>
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => goToMonitoring(selectedEquipmentData.id)}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                            >
                                <ExternalLink size={18} />
                                Open Full Monitoring
                            </button>
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className={`
                    absolute bottom-4 left-4 z-[999] hidden md:block
                    ${selectedEquipment ? 'md:hidden' : ''}
                `}>
                    <div className={`
                        p-3 rounded-xl space-y-2
                        ${isDarkMode
                            ? 'bg-gray-900/90 backdrop-blur-xl border border-white/10'
                            : 'bg-white/90 backdrop-blur-xl shadow-lg border border-gray-100'
                        }
                    `}>
                        <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`}>
                            Status
                        </div>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <div key={key} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${config.bg}`} />
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {config.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MapView
