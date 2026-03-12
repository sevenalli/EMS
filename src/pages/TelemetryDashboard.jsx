import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Papa from 'papaparse'
import { useTranslation } from 'react-i18next'
import { useStore, mockData } from '../store/store'

const rawCsvFiles = import.meta.glob('../../mapping-files/*.csv', { query: '?raw', import: 'default', eager: true })
const dynamicTagsMap = {}

for (const path in rawCsvFiles) {
    const rawText = rawCsvFiles[path]
    const equipmentCode = path.split('/').pop().replace('.csv', '')
    
    const parsed = Papa.parse(rawText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true
    })
    
    dynamicTagsMap[equipmentCode] = parsed.data.map(row => ({
        tag_id: row.Nom,
        function_name: row.Fonction || row.Categorie || 'Général',
        description: row.Commentaire || row.Nom,
        address: row.Adresse,
        category: row.Categorie,
        unit: row.Unité || ''
    })).filter(t => t.tag_id)
}
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
    Download
} from 'lucide-react'
import SemiGauge from '../components/SemiGauge'
import {
    TELEMETRY_CATEGORIES,
    DEFAULT_TELEMETRY,
    TIME_RANGES,
    PLAYBACK_SPEEDS,
    TAG_MAPPINGS,
    buildM5Groups
} from '../data/telemetryData'
import { useHistory } from '../hooks/useHistory'
import { useMqtt } from '../hooks/useMqtt'
import { useTopicDiscovery } from '../hooks/useTopicDiscovery'
import { exportTelemetrySnapshot } from '../utils/exportUtils'

const TelemetryDashboard = () => {
    const { equipmentId, functionGroup } = useParams()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const hasDynamicTags = !!dynamicTagsMap[equipmentId]
    const equipmentTags = dynamicTagsMap[equipmentId] || []

    // ─── Dynamic: build function groups from mapping files ───
    const m5Groups = useMemo(
        () => (hasDynamicTags ? buildM5Groups(equipmentTags) : []),
        [equipmentId, hasDynamicTags]
    )
    const isDarkMode = useStore((state) => state.isDarkMode)

    // Get equipment port from mock data
    const equipmentData = mockData.equipment.find(eq => eq.id === equipmentId)
    const portId = equipmentData?.portId || 'SMA'  // Default to SMA if not found

    // Dynamic topic based on port/equipmentId format
    const dynamicTopic = `${portId.toLowerCase()}/${equipmentId}`

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

    // State for MQTT configuration
    const [brokerUrl, setBrokerUrl] = useState('ws://localhost:8000/mqtt')
    const [showSettings, setShowSettings] = useState(false)

    // State for export dropdown
    const [showExportMenu, setShowExportMenu] = useState(false)
    const exportMenuRef = useRef(null)

    // MQTT hook for live telemetry - useMock=false for real data with dynamic topic
    const { telemetry: mqttTelemetry, isConnected: mqttConnected, error: mqttError } = useMqtt(
        equipmentId,
        {
            useMock: false,
            topic: dynamicTopic,
            brokerUrl
        } // Use real MQTT connection with dynamic topic
    )

    // Use topic discovery to get fallback data (already discovered)
    const { getEquipmentData, isEquipmentOnline } = useTopicDiscovery()
    const discoveredData = getEquipmentData(equipmentId)

    // Telemetry data
    const [telemetry, setTelemetry] = useState(DEFAULT_TELEMETRY)
    const [historyData, setHistoryData] = useState([])

    // Live mode - use real MQTT data or fallback to discovered data
    useEffect(() => {
        if (isHistoryMode) return

        // Use MQTT telemetry if available, otherwise try discovered data
        const liveData = mqttTelemetry || discoveredData?.latestData

        if (liveData) {
            console.log('[TelemetryDashboard] Received telemetry:', Object.keys(liveData).slice(0, 5))
            setTelemetry(prev => ({
                ...prev,
                ...liveData
            }))
        }
    }, [isHistoryMode, mqttTelemetry, discoveredData])

    // Fetch history data when switching to history mode or changing time range
    useEffect(() => {
        if (!isHistoryMode) return

        const loadHistory = async () => {
            // Explicitly request ALL tags defined in our mapping. 
            // Sending default [] causes backend to return only a single "fresh" tag.
            const allTags = Object.values(TAG_MAPPINGS);
            const result = await fetchHistoricalData(selectedTimeRange, allTags, equipmentId)

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
    }, [isHistoryMode, selectedTimeRange, fetchHistoricalData, equipmentId])

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false)
            }
        }

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showExportMenu])

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

    // Build column list based on current view and export
    const handleExport = (format) => {
        let columns = []

        // Dynamic tags + function group - export only that group
        if (hasDynamicTags && functionGroup) {
            const decodedFn = decodeURIComponent(functionGroup)
            const groupTags = equipmentTags.filter(t => t.function_name === decodedFn)
            columns = groupTags.map(tag => ({
                key: tag.tag_id,
                label: tag.description || tag.tag_id,
                unit: tag.unit || ''
            }))
        }
        // Dynamic tags - export all
        else if (hasDynamicTags) {
            columns = equipmentTags.map(tag => ({
                key: tag.tag_id,
                label: tag.description || tag.tag_id,
                unit: tag.unit || ''
            }))
        }
        // Generic equipment - flatten all widgets
        else {
            Object.entries(TELEMETRY_CATEGORIES).forEach(([, category]) => {
                category.widgets.forEach(widget => {
                    columns.push({
                        key: widget.key,
                        label: widget.label,
                        unit: widget.unit || ''
                    })
                })
            })
        }

        // Export current telemetry
        exportTelemetrySnapshot(telemetry, equipmentId, { format, columns })
        setShowExportMenu(false)
    }

    // Icon mapping for all 19 categories
    const iconMap = {
        Weight, Droplets, Zap, Compass, Settings, Clock, Fuel, Thermometer, Power,
        Gauge, AlertTriangle, Scale, ArrowUpDown, RotateCcw, MoveVertical, Truck
    }

    // Get status color for value
    const getStatusColor = (value, thresholds) => {
        if (!thresholds) return isDarkMode ? 'text-white' : 'text-gray-800'
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
                        <div className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`} style={{ fontFamily: "'Segoe UI', system-ui" }}>
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
                                {windDanger ? t('telemetry.danger') : windWarning ? t('telemetry.warning') : t('telemetry.safe')}
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
                        <div className={`text-lg font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`} style={{ fontFamily: "'Segoe UI', system-ui" }}>
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
                                {isOn ? t('equipment.on') : t('equipment.off')}
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
                        <div className={`text-3xl font-bold ${isWarning ? 'text-amber-500' : (isDarkMode ? 'text-white' : 'text-gray-800')}`} style={{ fontFamily: "'Segoe UI', system-ui" }}>
                            {value?.toFixed(0) || 0}
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-1">{widget.unit}</div>
                    </div>
                )
            default:
                return (
                    <div className="text-center">
                        <div className="text-[11px] font-medium text-gray-400 uppercase">{widget.label}</div>
                        <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{value?.toFixed?.(1) || value}</div>
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

                    {/* Center - Group name (Dynamic Detail) or Mode Toggle */}
                    {hasDynamicTags && functionGroup ? (
                        <div className="flex flex-col items-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{equipmentId}</div>
                            <div className={`text-sm font-semibold truncate max-w-xs ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {decodeURIComponent(functionGroup)}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-black/20 rounded-full p-1">
                            <button
                                onClick={() => toggleMode('live')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${!isHistoryMode
                                    ? 'bg-green-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <Radio size={16} className={!isHistoryMode ? 'animate-pulse' : ''} />
                                {t('playback.live')}
                            </button>
                            <button
                                onClick={() => toggleMode('history')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isHistoryMode
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <History size={16} />
                                {t('playback.history')}
                            </button>
                        </div>
                    )}

                    {/* Right - Export button, Connection status & Time display */}
                    <div className="text-right flex items-center gap-3 relative">
                        {/* Export Button */}
                        <div className="relative" ref={exportMenuRef}>
                            <button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors ${isDarkMode
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                    }`}
                                title="Export current telemetry data as PDF, Excel, or CSV"
                            >
                                <Download size={14} />
                                {t('export.title')}
                            </button>

                            {/* Export Dropdown Menu */}
                            {showExportMenu && (
                                <div className={`absolute right-0 mt-2 w-32 rounded-lg shadow-lg z-50 ${isDarkMode
                                    ? 'bg-[#2a3555] border border-gray-600'
                                    : 'bg-white border border-gray-200'
                                    }`}>
                                    <button
                                        onClick={() => handleExport('pdf')}
                                        className={`block w-full text-left px-4 py-2 text-sm rounded-t-lg transition-colors ${isDarkMode
                                            ? 'hover:bg-blue-500/30 text-gray-200'
                                            : 'hover:bg-blue-50 text-gray-800'
                                            }`}
                                    >
                                        {t('export.pdf')}
                                    </button>
                                    <button
                                        onClick={() => handleExport('xlsx')}
                                        className={`block w-full text-left px-4 py-2 text-sm border-t transition-colors ${isDarkMode
                                            ? 'border-gray-600 hover:bg-blue-500/30 text-gray-200'
                                            : 'border-gray-200 hover:bg-blue-50 text-gray-800'
                                            }`}
                                    >
                                        {t('export.xlsx')}
                                    </button>
                                    <button
                                        onClick={() => handleExport('csv')}
                                        className={`block w-full text-left px-4 py-2 text-sm rounded-b-lg border-t transition-colors ${isDarkMode
                                            ? 'border-gray-600 hover:bg-blue-500/30 text-gray-200'
                                            : 'border-gray-200 hover:bg-blue-50 text-gray-800'
                                            }`}
                                    >
                                        {t('export.csv')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* MQTT Connection Status (only show in live mode) */}
                        {!isHistoryMode && (() => {
                            const isOnline = mqttConnected || isEquipmentOnline(equipmentId) || !!discoveredData
                            return (
                                <div
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${isOnline
                                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        }`}
                                    title="Click to configure broker"
                                >
                                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                                    {isOnline ? t('common.online') : t('common.offline')}
                                </div>
                            )
                        })()}
                        <div>
                            <div className="text-xs text-gray-400">
                                {isHistoryMode ? t('telemetry.playbackMode') : t('playback.live')}
                            </div>
                            <div className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {(currentPlaybackTime || new Date()).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Connection Settings Panel */}
                {showSettings && !isHistoryMode && (
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-md">
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('settings.mqttBrokerUrl')}</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={brokerUrl}
                                        onChange={(e) => setBrokerUrl(e.target.value)}
                                        className={`flex-1 px-3 py-1.5 rounded text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'
                                            }`}
                                        placeholder="ws://localhost:9001"
                                    />
                                    <button
                                        onClick={() => setBrokerUrl('ws://pi5:9001')}
                                        className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-500 text-xs font-medium hover:bg-blue-500/20"
                                    >
                                        {t('settings.usePi5')}
                                    </button>
                                </div>
                            </div>
                            {mqttError && (
                                <div className="flex-1 text-xs text-red-400 flex items-center gap-2">
                                    <AlertTriangle size={14} />
                                    {mqttError}
                                </div>
                            )}
                        </div>
                        <div className="mt-2 text-[10px] text-gray-500">
                            <p>Try <b>ws://pi5:9001</b> if connecting to a Raspberry Pi with hostname 'pi5'.</p>
                            <p>Ensure your browser allows access to the WebSocket port (no mixed content blocking).</p>
                        </div>
                    </div>
                )}

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
                                {PLAYBACK_SPEEDS.map(speedOption => (
                                    <button
                                        key={speedOption.label}
                                        onClick={() => setPlaybackSpeed(speedOption.value)}
                                        className={`px-2 py-1 rounded text-xs font-medium ${playbackSpeed === speedOption.value
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-600/30 text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        {speedOption.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Status indicators */}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                            {isLoading && (
                                <div className="flex items-center gap-2 text-blue-400">
                                    <RefreshCw size={14} className="animate-spin" />
                                    {t('telemetry.loadingHistory')}
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
                                    {t('telemetry.dataPoints', { count: historyData.length, frame: playbackIndex + 1, total: historyData.length })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Dynamic: Grouped function_name view ─── */}
            {hasDynamicTags && !functionGroup && (
                <div className="p-4">
                    {m5Groups.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
                            <Wifi size={40} className="text-gray-600" />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('telemetry.loadingTagMap', { id: equipmentId })}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {t('telemetry.functionGroups', { count: m5Groups.length })}
                            </p>
                            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {m5Groups.map(([fn, tags]) => (
                                    <Link
                                        key={fn}
                                        to={`/telemetry/${equipmentId}/${encodeURIComponent(fn)}`}
                                        className={`flex items-center justify-between gap-3 px-5 py-4 rounded-xl transition-all
                                            ${isDarkMode
                                                ? 'bg-[#2a3555] hover:bg-[#334070] border border-transparent hover:border-blue-500/40'
                                                : 'bg-white shadow-sm hover:shadow-md border border-transparent hover:border-blue-400/40'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${mqttTelemetry ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                                                }`} />
                                            <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                                {fn}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[11px] font-semibold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                                {tags.length} tag{tags.length !== 1 ? 's' : ''}
                                            </span>
                                            <ChevronLeft size={16} className="text-gray-500 rotate-180" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ─── Dynamic: Group detail view ─── */}
            {hasDynamicTags && functionGroup && (() => {
                const decodedFn = decodeURIComponent(functionGroup)
                // Use mapping files: tag_id is the exact MQTT key, description is the label
                const groupTags = equipmentTags.filter(t => t.function_name === decodedFn)
                // Debug: show what we're looking up
                console.log(`[${equipmentId} Detail]`, decodedFn, 'tags:', groupTags.slice(0, 3).map(t => t.tag_id),
                    'telemetry sample:', groupTags.slice(0, 3).map(t => [t.tag_id, telemetry[t.tag_id]]))

                const isCalage = decodedFn.toLowerCase().includes('calage')

                return (
                    <div className="p-4">
                        <h4 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {decodedFn}
                        </h4>

                        {/* Chassis diagram — shown only for Calage function group */}
                        {isCalage && (
                            <div className={`mb-8 rounded-2xl p-6 flex justify-center ${isDarkMode ? 'bg-[#1a2035]' : 'bg-gray-50 border border-gray-200'}`}>
                                <img
                                    src="/chassis.svg"
                                    alt="Chassis diagram"
                                    className="w-full max-w-4xl h-auto object-contain"
                                    style={{ maxHeight: '500px' }}
                                />
                            </div>
                        )}

                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {groupTags.map((tag, i) => {
                                // tag.tag_id IS the MQTT key — lookup from accumulated telemetry state
                                const rawVal = telemetry[tag.tag_id]
                                const hasValue = rawVal !== undefined && rawVal !== null
                                return (
                                    <div
                                        key={`${tag.tag_id}-${i}`}
                                        className={`p-4 rounded-xl ${isDarkMode ? 'bg-[#2a3555]' : 'bg-white shadow-sm'}`}
                                    >
                                        <div
                                            className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 truncate"
                                            title={tag.tag_id}
                                        >
                                            {tag.description || tag.tag_id}
                                        </div>
                                        <div className={`text-2xl font-bold font-mono mt-1 ${hasValue ? (isDarkMode ? 'text-white' : 'text-gray-800') : 'text-gray-600'}`}>
                                            {hasValue
                                                ? (typeof rawVal === 'number' ? rawVal.toFixed(2) : String(rawVal))
                                                : '–'}
                                            {tag.unit && <span className="text-sm font-medium text-gray-400 ml-1">{tag.unit}</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })()}

            {/* ─── Generic equipment: original category grid ─── */}
            {!hasDynamicTags && (
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
            )}
        </div>
    )
}

export default TelemetryDashboard
