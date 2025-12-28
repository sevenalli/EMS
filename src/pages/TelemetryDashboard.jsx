import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store/store'
import {
    ChevronLeft,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Radio,
    History,
    Weight,
    Droplets,
    Zap,
    Compass,
    Settings,
    Clock,
    Wind,
    Thermometer,
    Fuel,
    Power,
    Box,
    Lock,
    Unlock,
    RefreshCw,
    AlertCircle,
    Wifi,
    WifiOff,
    Gauge,
    AlertTriangle,
    Scale,
    ArrowUpDown,
    RotateCcw,
    MoveVertical,
    Truck,
    Cpu
} from 'lucide-react'
import SemiGauge from '../components/SemiGauge'
import {
    TELEMETRY_CATEGORIES,
    DEFAULT_TELEMETRY,
    TIME_RANGES,
    PLAYBACK_SPEEDS,
    TAG_MAPPINGS
} from '../data/telemetryData'
import { useHistory } from '../hooks/useHistory'
import { useMqtt } from '../hooks/useMqtt'

const TelemetryDashboard = () => {
    const { equipmentId } = useParams()
    const navigate = useNavigate()
    const isDarkMode = useStore((state) => state.isDarkMode)

    // History hook
    const {
        isLoading,
        error: historyError,
        fetchHistoricalData,
        getStateAtIndex
    } = useHistory()

    // Mode state
    const [isHistoryMode, setIsHistoryMode] = useState(false)
    const [selectedTimeRange, setSelectedTimeRange] = useState(TIME_RANGES[0])

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(1)
    const [playbackProgress, setPlaybackProgress] = useState(0)
    const [playbackIndex, setPlaybackIndex] = useState(0)
    const [currentPlaybackTime, setCurrentPlaybackTime] = useState(null)
    const playbackRef = useRef(null)

    // MQTT hook for live telemetry - useMock=false for real data
    const { telemetry: mqttTelemetry, isConnected: mqttConnected, error: mqttError } = useMqtt(
        equipmentId,
        { useMock: false } // Use real MQTT connection
    )

    // Telemetry data
    const [telemetry, setTelemetry] = useState(DEFAULT_TELEMETRY)
    const [historyData, setHistoryData] = useState([])

    // Live mode - use real MQTT data
    useEffect(() => {
        if (isHistoryMode) return

        // Map MQTT telemetry to full telemetry format
        if (mqttTelemetry) {
            console.log('[TelemetryDashboard] Received MQTT telemetry:', mqttTelemetry)
            setTelemetry(prev => ({
                ...prev,
                // Map from useMqtt format to our telemetry keys
                heuresService: mqttTelemetry.engineHours || prev.heuresService,
                chargeBrute: mqttTelemetry.loadWeight || prev.chargeBrute,
                vitesseVent: mqttTelemetry.windSpeed || prev.vitesseVent,
                niveauCarburant: mqttTelemetry.fuelLevel || prev.niveauCarburant,
                kranHauptschalter: mqttTelemetry.isActive ?? prev.kranHauptschalter,
                tempHydraulique: mqttTelemetry.hydraulicTemp || prev.tempHydraulique,
                dieselEnMarche: mqttTelemetry.dieselRunning ?? prev.dieselEnMarche,
                tempMoteurLevage: mqttTelemetry.motorTemp || prev.tempMoteurLevage,
            }))
        }
    }, [isHistoryMode, mqttTelemetry])

    // Fetch history data when switching to history mode or changing time range
    useEffect(() => {
        if (!isHistoryMode) return

        const loadHistory = async () => {
            const result = await fetchHistoricalData(selectedTimeRange)

            if (result?.history) {
                setHistoryData(result.history)
                setPlaybackIndex(0)
                setPlaybackProgress(0)

                if (result.history[0]) {
                    setTelemetry(result.history[0].data)
                    setCurrentPlaybackTime(result.history[0].timestamp)
                }
            }
        }

        loadHistory()
    }, [isHistoryMode, selectedTimeRange, fetchHistoricalData])

    // Playback logic - same pattern as Angular's supension component
    useEffect(() => {
        if (!isPlaying || !isHistoryMode || historyData.length === 0) return

        const intervalMs = 1000 / playbackSpeed // 1 second per frame at 1x speed

        playbackRef.current = setInterval(() => {
            setPlaybackIndex(prev => {
                const next = prev + 1

                // Loop back to start when reaching end
                if (next >= historyData.length) {
                    setIsPlaying(false)
                    return historyData.length - 1
                }

                // Update telemetry and progress
                if (historyData[next]) {
                    setTelemetry(historyData[next].data)
                    setCurrentPlaybackTime(historyData[next].timestamp)
                    setPlaybackProgress((next / (historyData.length - 1)) * 100)
                }

                return next
            })
        }, intervalMs)

        return () => {
            if (playbackRef.current) clearInterval(playbackRef.current)
        }
    }, [isPlaying, isHistoryMode, historyData, playbackSpeed])

    // Mode toggle handler
    const toggleMode = (mode) => {
        setIsHistoryMode(mode === 'history')
        if (mode === 'live') {
            setIsPlaying(false)
            setPlaybackProgress(0)
        }
    }

    // Seek handler
    const handleSeek = (e) => {
        const progress = parseInt(e.target.value)
        setPlaybackProgress(progress)
        const dataIndex = Math.floor((progress / 100) * (historyData.length - 1))
        setPlaybackIndex(dataIndex)
        if (historyData[dataIndex]) {
            setTelemetry(historyData[dataIndex].data)
            setCurrentPlaybackTime(historyData[dataIndex].timestamp)
        }
    }

    // Skip backward
    const handleSkipBack = () => {
        const newIndex = Math.max(0, playbackIndex - 10)
        setPlaybackIndex(newIndex)
        setPlaybackProgress((newIndex / (historyData.length - 1)) * 100)
        if (historyData[newIndex]) {
            setTelemetry(historyData[newIndex].data)
            setCurrentPlaybackTime(historyData[newIndex].timestamp)
        }
    }

    // Skip forward
    const handleSkipForward = () => {
        const newIndex = Math.min(historyData.length - 1, playbackIndex + 10)
        setPlaybackIndex(newIndex)
        setPlaybackProgress((newIndex / (historyData.length - 1)) * 100)
        if (historyData[newIndex]) {
            setTelemetry(historyData[newIndex].data)
            setCurrentPlaybackTime(historyData[newIndex].timestamp)
        }
    }

    // Icon mapping for all 19 categories
    const iconMap = {
        Weight, Droplets, Zap, Compass, Settings, Clock, Fuel, Thermometer, Power,
        Gauge, AlertTriangle, Scale, ArrowUpDown, RotateCcw, MoveVertical, Truck, Cpu
    }

    // Get status color for value
    const getStatusColor = (value, thresholds) => {
        if (!thresholds) return 'text-white'
        if (value >= thresholds.danger) return 'text-red-500'
        if (value >= thresholds.warning) return 'text-amber-500'
        return 'text-green-500'
    }

    // Render widget based on type
    const renderWidget = (widget, value) => {
        switch (widget.type) {
            case 'gauge':
                return (
                    <SemiGauge
                        value={value}
                        min={widget.min || 0}
                        max={widget.max || 100}
                        title={widget.label}
                        unit={widget.unit}
                        size={130}
                    />
                )
            case 'digital':
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{widget.label}</div>
                        <div className="text-4xl font-bold text-white" style={{ fontFamily: "'Segoe UI', system-ui" }}>
                            {typeof value === 'number' ? value.toFixed(1) : value}
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-1">{widget.unit}</div>
                    </div>
                )
            case 'digital-status':
                const windWarning = widget.key === 'vitesseVent' && value >= 8
                const windDanger = widget.key === 'vitesseVent' && value >= 15
                const freqOk = widget.key === 'frequenceReseau' && value >= 49 && value <= 51
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                            {widget.key === 'vitesseVent' && <Wind size={14} />}
                            {widget.label}
                        </div>
                        <div className={`text-4xl font-bold ${windDanger ? 'text-red-500' :
                            windWarning ? 'text-amber-500' :
                                widget.key === 'frequenceReseau' ? (freqOk ? 'text-green-500' : 'text-amber-500') :
                                    'text-green-500'
                            }`} style={{ fontFamily: "'Segoe UI', system-ui" }}>
                            {typeof value === 'number' ? value.toFixed(1) : value}
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-1">{widget.unit}</div>
                        {widget.key === 'vitesseVent' && (
                            <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full inline-block ${windDanger ? 'bg-red-500/20 text-red-400' :
                                windWarning ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-green-500/20 text-green-400'
                                }`}>
                                {windDanger ? 'DANGER' : windWarning ? 'WARNING' : 'SAFE'}
                            </div>
                        )}
                    </div>
                )
            case 'vertical-bar':
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{widget.label}</div>
                        <div className="w-12 h-24 bg-black/40 rounded-lg relative overflow-hidden mx-auto border border-gray-600">
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 transition-all"
                                style={{ height: `${Math.min(100, value)}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-lg">
                                {Math.round(value)}%
                            </span>
                        </div>
                    </div>
                )
            case 'fuel-tank':
                const fuelLow = value <= 20
                const fuelMed = value <= 50
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{widget.label}</div>
                        <div className="w-14 h-20 bg-black/40 rounded-xl rounded-b-3xl relative overflow-hidden mx-auto border-2 border-gray-600">
                            <div
                                className={`absolute bottom-0 left-0 right-0 transition-all ${fuelLow ? 'bg-gradient-to-t from-red-500 to-red-400' :
                                    fuelMed ? 'bg-gradient-to-t from-amber-500 to-amber-400' :
                                        'bg-gradient-to-t from-green-500 to-green-400'
                                    }`}
                                style={{ height: `${value}%` }}
                            />
                            <Fuel size={18} className="absolute top-2 left-1/2 -translate-x-1/2 text-white/40" />
                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-bold text-sm drop-shadow-lg">
                                {Math.round(value)}%
                            </span>
                        </div>
                    </div>
                )
            case 'thermometer':
                const tempHigh = value > 85
                const tempMed = value > 60
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                            <Thermometer size={14} /> {widget.label}
                        </div>
                        <div className="w-8 h-20 bg-black/40 rounded-full relative overflow-hidden mx-auto border border-gray-600">
                            <div
                                className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                                style={{
                                    height: `${(value / (widget.max || 110)) * 100}%`,
                                    background: `linear-gradient(to top, ${tempHigh ? '#ef4444' : tempMed ? '#f97316' : '#22c55e'
                                        }, ${tempHigh ? '#dc2626' : tempMed ? '#ea580c' : '#16a34a'
                                        })`
                                }}
                            />
                        </div>
                        <div className="text-lg font-bold text-white mt-2" style={{ fontFamily: "'Segoe UI', system-ui" }}>
                            {value?.toFixed(0) || 0}°C
                        </div>
                    </div>
                )
            case 'boolean':
                const isOn = value === true || value === 1
                return (
                    <div className={`p-3 rounded-lg flex items-center gap-3 ${isOn
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-gray-500/10 border border-gray-500/30'
                        }`}>
                        <Power size={18} className={isOn ? 'text-green-500' : 'text-gray-500'} />
                        <div>
                            <div className="text-xs text-gray-400">{widget.label}</div>
                            <div className={`text-sm font-bold ${isOn ? 'text-green-500' : 'text-gray-400'}`}>
                                {isOn ? 'ON' : 'OFF'}
                            </div>
                        </div>
                    </div>
                )
            case 'odometer':
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{widget.label}</div>
                        <div className="text-3xl font-bold text-amber-500 font-mono tracking-wider">
                            {value?.toLocaleString() || '0'}
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-1">{widget.unit}</div>
                    </div>
                )
            case 'digital-warning':
                const isWarning = value < 50
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">{widget.label}</div>
                        <div className={`text-3xl font-bold ${isWarning ? 'text-amber-500' : 'text-white'}`} style={{ fontFamily: "'Segoe UI', system-ui" }}>
                            {value?.toFixed(0) || 0}
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-1">{widget.unit}</div>
                    </div>
                )
            default:
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase">{widget.label}</div>
                        <div className="text-2xl font-bold text-white">{value?.toFixed?.(1) || value}</div>
                    </div>
                )
        }
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-[#1a1f2e]' : 'bg-gray-100'}`}>
            {/* Header */}
            <div className={`sticky top-0 z-50 ${isDarkMode ? 'bg-[#222b45]' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="px-4 py-3 flex items-center justify-between">
                    {/* Left - Back button */}
                    <button
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-[#2a3555]' : 'hover:bg-gray-100'}`}
                    >
                        <ChevronLeft size={24} className={isDarkMode ? 'text-white' : 'text-gray-800'} />
                    </button>

                    {/* Center - Mode Toggle */}
                    <div className="flex items-center gap-2 bg-black/20 rounded-full p-1">
                        <button
                            onClick={() => toggleMode('live')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${!isHistoryMode
                                ? 'bg-green-500 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Radio size={16} className={!isHistoryMode ? 'animate-pulse' : ''} />
                            LIVE
                        </button>
                        <button
                            onClick={() => toggleMode('history')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isHistoryMode
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <History size={16} />
                            HISTORY
                        </button>
                    </div>

                    {/* Right - Connection status & Time display */}
                    <div className="text-right flex items-center gap-3">
                        {/* MQTT Connection Status (only show in live mode) */}
                        {!isHistoryMode && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${mqttConnected
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                                }`}>
                                {mqttConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                                {mqttConnected ? 'Connected' : 'Disconnected'}
                            </div>
                        )}
                        <div>
                            <div className="text-xs text-gray-400">
                                {isHistoryMode ? 'Playback' : 'Live'}
                            </div>
                            <div className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {(currentPlaybackTime || new Date()).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Controls */}
                {isHistoryMode && (
                    <div className={`px-4 py-3 border-t ${isDarkMode ? 'border-gray-700 bg-[#1a2035]' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-4">
                            {/* Time Range Selector */}
                            <div className="flex gap-1">
                                {TIME_RANGES.map(range => (
                                    <button
                                        key={range.label}
                                        onClick={() => setSelectedTimeRange(range)}
                                        className={`px-3 py-1 rounded text-xs font-medium ${selectedTimeRange.label === range.label
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-600/30 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {range.label}
                                    </button>
                                ))}
                            </div>

                            {/* Playback Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleSkipBack}
                                    className="p-1.5 rounded hover:bg-gray-600/30"
                                    title="Skip back 10 frames"
                                >
                                    <SkipBack size={18} className="text-gray-400" />
                                </button>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="p-2 rounded-full bg-blue-500 hover:bg-blue-600"
                                >
                                    {isPlaying ? <Pause size={18} className="text-white" /> : <Play size={18} className="text-white" />}
                                </button>
                                <button
                                    onClick={handleSkipForward}
                                    className="p-1.5 rounded hover:bg-gray-600/30"
                                    title="Skip forward 10 frames"
                                >
                                    <SkipForward size={18} className="text-gray-400" />
                                </button>
                            </div>

                            {/* Timeline Slider */}
                            <div className="flex-1">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={playbackProgress}
                                    onChange={handleSeek}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Speed Selector */}
                            <div className="flex gap-1">
                                {PLAYBACK_SPEEDS.map(speed => (
                                    <button
                                        key={speed}
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className={`px-2 py-1 rounded text-xs font-medium ${playbackSpeed === speed
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-600/30 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                            {isLoading && (
                                <div className="flex items-center gap-2 text-blue-400">
                                    <RefreshCw size={14} className="animate-spin" />
                                    Loading history data...
                                </div>
                            )}
                            {historyError && (
                                <div className="flex items-center gap-2 text-amber-400">
                                    <AlertCircle size={14} />
                                    {historyError}
                                </div>
                            )}
                            {!isLoading && historyData.length > 0 && (
                                <div className="text-gray-400">
                                    {historyData.length} data points | Frame {playbackIndex + 1} of {historyData.length}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Content */}
            <div className="p-4 space-y-6">
                {Object.entries(TELEMETRY_CATEGORIES).map(([categoryKey, category]) => {
                    const IconComponent = iconMap[category.icon] || Settings

                    return (
                        <div key={categoryKey}>
                            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                <IconComponent size={14} className={`text-${category.color}-500`} />
                                {category.title}
                            </h4>

                            <div className={`grid gap-5 ${category.widgets[0]?.type === 'boolean'
                                ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'
                                : 'grid-cols-2 md:grid-cols-4'
                                }`}>
                                {category.widgets.map(widget => (
                                    <div
                                        key={widget.key}
                                        className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[160px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-white shadow-sm'
                                            } ${widget.type === 'boolean' ? 'min-h-0 p-0' : ''}`}
                                    >
                                        {renderWidget(widget, telemetry[widget.key])}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default TelemetryDashboard
