import { useNavigate } from 'react-router-dom'
import { useStore, mockData } from '../store/store'
import { getInventory } from '../services/equipmentAdmin'
import { useTopicDiscovery } from '../hooks/useTopicDiscovery'
import EquipmentCard from '../components/EquipmentCard'
import {
    ChevronLeft,
    RefreshCw,
    Settings,
    Maximize2,
    Grid3X3,
    LayoutGrid,
    Activity,
    Wifi,
    WifiOff,
    Radio,
    AlertCircle,
    History,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Calendar,
    Clock,
    Download,
    FileText
} from 'lucide-react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from '../hooks/useHistory'
import { TAG_MAPPINGS, TIME_RANGES, PLAYBACK_SPEEDS } from '../data/telemetryData'
import { exportToCSV, exportToPDF } from '../utils/exportUtils'
import DashboardCustomizer from '../components/dashboard/DashboardCustomizer'

const Dashboard = () => {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { selectedPort, selectedEquipment, isDarkMode } = useStore()
    const [gridSize, setGridSize] = useState('normal')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showCustomizer, setShowCustomizer] = useState(false)
    const [allEquipment, setAllEquipment] = useState([])

    useEffect(() => {
        getInventory().then(data => {
            const mapped = data.map(item => ({
                id: item.equipmentId,
                name: `${item.brand} ${item.model}`,
                categoryId: normalizeCategory(item.category),
                portId: item.siteName,
                status: item.isActive ? (item.status === 'ONLINE' ? 'active' : 'offline') : 'archived',
                craneType: 1,
                accessory: 'spreader',
                notifications: 0
            }))
            setAllEquipment(mapped)
        }).catch(console.error)
    }, [])

    const normalizeCategory = (cat) => {
        if (!cat) return 'grue-mobile'
        const lower = cat.toLowerCase()
        if (lower.includes('portique')) return 'portique'
        if (lower.includes('chariot')) return 'chariot'
        if (lower.includes('reach')) return 'reachstacker'
        return 'grue-mobile'
    }

    // Topic discovery hook for real-time equipment detection
    const {
        isConnected: mqttConnected,
        activeEquipment,
        discoveredPorts,
        onlineEquipmentCodes,
        isEquipmentOnline,
        getEquipmentByPort,
        getEquipmentData
    } = useTopicDiscovery({
        portFilter: selectedPort?.id || null  // Filter by selected port if any
    })

    // Build equipment list: show what user selected, enriched with live MQTT status.
    // Falls back to all non-archived API equipment when nothing is selected.
    const equipmentList = useMemo(() => {
        const enrich = (eq) => ({
            ...eq,
            isOnline: isEquipmentOnline(eq.id),
            mqttData: getEquipmentData(eq.id)?.latestData
        })

        if (selectedEquipment.length > 0) {
            // Show user-selected equipment (both online and offline)
            const apiItems = allEquipment
                .filter(eq => selectedEquipment.includes(eq.id) && eq.status !== 'archived')
                .map(enrich)

            // Include MQTT-discovered equipment the user selected but not yet in API
            const apiIds = new Set(apiItems.map(e => e.id))
            const mqttOnlyItems = selectedEquipment
                .filter(code => !apiIds.has(code) && onlineEquipmentCodes.includes(code))
                .map(code => {
                    const mqttData = getEquipmentData(code)
                    return {
                        id: code,
                        name: `Equipment ${code}`,
                        categoryId: 'grue-mobile',
                        portId: mqttData?.port || selectedPort?.id || 'SMA',
                        status: 'active',
                        craneType: 1,
                        accessory: 'benne',
                        notifications: 0,
                        isOnline: true,
                        mqttData: mqttData?.latestData
                    }
                })

            return [...apiItems, ...mqttOnlyItems]
        }

        // No selection yet — show all non-archived API equipment
        return allEquipment
            .filter(eq => eq.status !== 'archived')
            .map(enrich)
    }, [selectedEquipment, allEquipment, onlineEquipmentCodes, selectedPort, isEquipmentOnline, getEquipmentData])

    // History Mode State
    const [isHistoryMode, setIsHistoryMode] = useState(false)
    const [selectedTimeRange, setSelectedTimeRange] = useState(TIME_RANGES[0])
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(PLAYBACK_SPEEDS[0])
    const [playbackIndex, setPlaybackIndex] = useState(0)
    const [playbackProgress, setPlaybackProgress] = useState(0)
    const playbackRef = useRef(null)

    // History Hook
    const {
        historyData,
        isLoading: historyLoading,
        fetchHistoricalData
    } = useHistory()

    // Check if we can enable history mode (only if exactly 1 equipment is visible/selected)
    const canToggleHistory = equipmentList.length === 1
    const singleEquipment = canToggleHistory ? equipmentList[0] : null

    // Auto-disable history if condition is lost
    useEffect(() => {
        if (isHistoryMode && !canToggleHistory) {
            setIsHistoryMode(false)
            setIsPlaying(false)
        }
    }, [canToggleHistory, isHistoryMode])

    // Load History
    useEffect(() => {
        if (isHistoryMode && singleEquipment && selectedTimeRange) {
            const allTags = Object.values(TAG_MAPPINGS)
            fetchHistoricalData(selectedTimeRange, allTags, singleEquipment.id)
            setPlaybackIndex(0)
            setPlaybackProgress(0)
            setIsPlaying(false)
        }
    }, [isHistoryMode, selectedTimeRange, singleEquipment ? singleEquipment.id : null])

    // Playback Loop
    useEffect(() => {
        if (!isHistoryMode || !isPlaying || historyData.length === 0) return

        playbackRef.current = setInterval(() => {
            setPlaybackIndex(prev => {
                const next = prev + 1
                if (next >= historyData.length) {
                    setIsPlaying(false)
                    return prev
                }
                setPlaybackProgress((next / (historyData.length - 1)) * 100)
                return next
            })
        }, 1000 / playbackSpeed.value)

        return () => clearInterval(playbackRef.current)
    }, [isHistoryMode, isPlaying, historyData, playbackSpeed])

    // Playback Controls
    const togglePlayback = () => setIsPlaying(prev => !prev)
    const skipBackward = () => {
        const newIndex = Math.max(0, playbackIndex - 10)
        setPlaybackIndex(newIndex)
        setPlaybackProgress((newIndex / ((historyData?.length || 1) - 1)) * 100)
    }
    const skipForward = () => {
        const newIndex = Math.min((historyData?.length || 1) - 1, playbackIndex + 10)
        setPlaybackIndex(newIndex)
        setPlaybackProgress((newIndex / ((historyData?.length || 1) - 1)) * 100)
    }

    const handleRefresh = () => {
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 1000)
    }

    // Export handlers
    const handleExportCSV = () => {
        if (historyData && historyData.length > 0) {
            const exportData = historyData.map((item, index) => ({
                timestamp: item.timestamp?.toISOString() || new Date().toISOString(),
                index,
                ...item.data
            }))
            exportToCSV(exportData, `dashboard-export-${singleEquipment?.id || 'all'}`)
        }
    }

    const handleExportPDF = () => {
        if (historyData && historyData.length > 0) {
            const exportData = historyData.map((item, index) => ({
                timestamp: item.timestamp?.toISOString() || new Date().toISOString(),
                index,
                ...item.data
            }))
            exportToPDF(exportData, `dashboard-report-${singleEquipment?.id || 'all'}`, {
                title: `${t('dashboard.title')} - ${singleEquipment?.id || t('common.allEquipment')}`
            })
        }
    }

    const gridClasses = {
        compact: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        normal: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
        large: 'grid-cols-1 lg:grid-cols-2',
    }

    return (
        <div className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/equipment-selection')}
                        className={`flex items-center gap-2 mb-4 transition-colors group ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-primary'
                            }`}
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Modifier la sélection
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    Dashboard <span className="text-primary">Temps Réel</span>
                                </h1>
                                {selectedPort && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-primary'
                                        }`}>
                                        {selectedPort.name}
                                    </span>
                                )}
                            </div>
                            <p className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <Activity size={16} className="text-green-500" />
                                {equipmentList.length} équipement(s) en supervision
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                            {/* History Mode Toggle - Only if 1 equipment selected */}
                            {canToggleHistory && (
                                <div className={`flex items-center gap-2 p-1 rounded-lg mr-2 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                                    <button
                                        onClick={() => setIsHistoryMode(false)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${!isHistoryMode
                                            ? 'bg-green-600 text-white shadow-lg'
                                            : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        Live
                                    </button>
                                    <button
                                        onClick={() => setIsHistoryMode(true)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isHistoryMode
                                            ? 'bg-blue-600 text-white shadow-lg'
                                            : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        History
                                    </button>

                                    {isHistoryMode && (
                                        <select
                                            value={selectedTimeRange.label}
                                            onChange={(e) => {
                                                const range = TIME_RANGES.find(r => r.label === e.target.value)
                                                if (range) setSelectedTimeRange(range)
                                            }}
                                            className={`ml-2 px-2 py-1 rounded text-xs border focus:outline-none ${isDarkMode ? 'bg-black/30 border-white/20 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'
                                                }`}
                                        >
                                            {TIME_RANGES.map(range => (
                                                <option key={range.label} value={range.label} className="bg-gray-800">
                                                    {range.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Grid Size Toggle */}
                            <div className={`flex items-center rounded-lg p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                                }`}>
                                <button
                                    onClick={() => setGridSize('compact')}
                                    className={`p-2 rounded-md transition-all ${gridSize === 'compact'
                                        ? 'bg-primary text-white'
                                        : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    title="Compact"
                                >
                                    <Grid3X3 size={18} />
                                </button>
                                <button
                                    onClick={() => setGridSize('normal')}
                                    className={`p-2 rounded-md transition-all ${gridSize === 'normal'
                                        ? 'bg-primary text-white'
                                        : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    title="Normal"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setGridSize('large')}
                                    className={`p-2 rounded-md transition-all ${gridSize === 'large'
                                        ? 'bg-primary text-white'
                                        : isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                    title="Large"
                                >
                                    <Maximize2 size={18} />
                                </button>
                            </div>

                            {/* Export Buttons (only in history mode with data) */}
                            {isHistoryMode && historyData && historyData.length > 0 && (
                                <div className={`flex items-center rounded-lg p-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                                    <button
                                        onClick={handleExportCSV}
                                        className={`p-2 rounded-md transition-all ${isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-500 hover:text-green-600'}`}
                                        title={t('common.exportCSV')}
                                        aria-label="Export to CSV"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className={`p-2 rounded-md transition-all ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'}`}
                                        title={t('common.exportPDF')}
                                        aria-label="Export to PDF"
                                    >
                                        <FileText size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                className={`p-2.5 rounded-lg transition-all ${isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:text-white'
                                    : 'bg-white shadow-sm text-gray-500 hover:text-gray-700'
                                    }`}
                                title={t('common.refresh')}
                                aria-label="Refresh"
                            >
                                <RefreshCw
                                    size={18}
                                    className={isRefreshing ? 'animate-spin' : ''}
                                />
                            </button>

                            {/* Settings/Customizer Button */}
                            <button
                                onClick={() => setShowCustomizer(true)}
                                className={`p-2.5 rounded-lg transition-all ${isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:text-white'
                                    : 'bg-white shadow-sm text-gray-500 hover:text-gray-700'
                                    }`}
                                title={t('common.settings')}
                                aria-label="Settings"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dashboard Customizer Panel */}
                <DashboardCustomizer
                    isOpen={showCustomizer}
                    onClose={() => setShowCustomizer(false)}
                />

                {/* Equipment Grid */}
                {equipmentList.length > 0 ? (
                    <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                        {equipmentList.map((equipment) => (
                            <EquipmentCard
                                key={equipment.id}
                                equipment={equipment}
                                equipmentId={equipment.id}
                                initialStatus={equipment.status}
                                isOnline={isHistoryMode ? false : equipment.isOnline}
                                mqttData={
                                    isHistoryMode && canToggleHistory && historyData[playbackIndex] && equipment.id === singleEquipment?.id
                                        ? historyData[playbackIndex].data
                                        : equipment.mqttData
                                }
                                portId={equipment.portId}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty State - No Active Equipment */
                    <div className={`rounded-2xl p-12 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
                        <AlertCircle size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Aucun équipement actif
                        </h3>
                        <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {mqttConnected
                                ? 'En attente de données MQTT...'
                                : 'Connexion au broker MQTT en cours...'}
                        </p>
                        {selectedPort && (
                            <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                Port sélectionné: <span className="font-semibold">{selectedPort.id}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Stats Footer */}
                <div className={`mt-12 rounded-2xl p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                    }`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-500 mb-1">
                                {equipmentList.filter(eq => eq.isOnline).length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>En ligne</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {equipmentList.filter(eq => !eq.isOnline).length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Hors ligne</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-cyan-500 mb-1">
                                {discoveredPorts.length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Ports</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {onlineEquipmentCodes.length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total actif</div>
                        </div>
                    </div>
                </div>

                {/* Connection Info */}
                <div className={`mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    <div className="flex items-center gap-2">
                        {mqttConnected ? (
                            <>
                                <Wifi size={16} className="text-green-500" />
                                <span className="text-green-500 font-medium">Connecté au broker MQTT</span>
                            </>
                        ) : (
                            <>
                                <WifiOff size={16} className="text-red-500" />
                                <span className="text-red-500 font-medium">Déconnecté du broker MQTT</span>
                            </>
                        )}
                    </div>
                    {mqttConnected && (discoveredPorts.length > 0 || onlineEquipmentCodes.length > 0) && (
                        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-opacity-20 backdrop-blur-sm"
                            style={{ backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
                            <Radio size={14} className="text-amber-500 animate-pulse" />
                            {discoveredPorts.length > 0 && (
                                <span>
                                    Ports: <span className="font-semibold text-amber-500">{discoveredPorts.join(', ')}</span>
                                </span>
                            )}
                            {onlineEquipmentCodes.length > 0 && (
                                <span>
                                    | Équipements: <span className="font-semibold text-cyan-500">{onlineEquipmentCodes.slice(0, 3).join(', ')}{onlineEquipmentCodes.length > 3 ? ` +${onlineEquipmentCodes.length - 3}` : ''}</span>
                                </span>
                            )}
                        </div>
                    )}
                    <span className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>
                        Topic: {selectedPort?.id || '+'}/{onlineEquipmentCodes[0] || '+'}
                    </span>
                </div>
            </div>
            {/* Playback Bar */}
            {isHistoryMode && historyData.length > 0 && (
                <div className={`fixed bottom-0 left-0 right-0 px-4 py-3 border-t backdrop-blur-md z-50 transition-all ${isDarkMode ? 'bg-gray-900/90 border-white/10' : 'bg-white/90 border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]'
                    }`}>
                    <div className="max-w-7xl mx-auto flex items-center gap-4">
                        {/* Playback Controls */}
                        <div className="flex items-center gap-2">
                            <button onClick={skipBackward} className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-800'}`}>
                                <SkipBack size={20} />
                            </button>
                            <button
                                onClick={togglePlayback}
                                className={`p-2 rounded-full ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'}`}
                            >
                                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                            </button>
                            <button onClick={skipForward} className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-800'}`}>
                                <SkipForward size={20} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex-1 h-2 bg-gray-200/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-200"
                                style={{ width: `${playbackProgress}%` }}
                            />
                        </div>

                        {/* Info & Speed */}
                        <div className="flex items-center gap-4 min-w-fit">
                            <span className={`text-xs font-mono tabular-nums ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {playbackIndex + 1} / {historyData.length}
                            </span>

                            <select
                                value={playbackSpeed.label}
                                onChange={(e) => setPlaybackSpeed(PLAYBACK_SPEEDS.find(s => s.label === e.target.value))}
                                className={`px-2 py-1 rounded text-xs border focus:outline-none ${isDarkMode ? 'bg-black/30 border-white/20 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'
                                    }`}
                            >
                                {PLAYBACK_SPEEDS.map(speed => (
                                    <option key={speed.label} value={speed.label} className="bg-gray-800">
                                        {speed.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
