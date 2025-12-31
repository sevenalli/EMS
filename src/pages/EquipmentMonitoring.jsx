import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore, mockData } from '../store/store'
import { useMqtt } from '../hooks/useMqtt'
import { useTopicDiscovery } from '../hooks/useTopicDiscovery'
import { useHistory } from '../hooks/useHistory'
import {
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    RotateCw,
    ChevronUp,
    ChevronDown,
    ChevronsUp,
    ChevronsDown,
    Lock,
    Unlock,
    Wifi,
    WifiOff,
    Activity,
    Gauge,
    ArrowDownUp,
    ArrowUpDown,
    Box,
    Wind,
    Thermometer,
    Fuel,
    Weight,
    Bell,
    Droplets,
    Zap,
    Settings,
    Power,
    Clock,
    TrendingUp,
    Radio,
    History,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Calendar
} from 'lucide-react'
import SemiGauge from '../components/SemiGauge'
import { TAG_MAPPINGS, TIME_RANGES, PLAYBACK_SPEEDS } from '../data/telemetryData'

// Crane type images
const craneImages = {
    1: '/crane-1.png',
    2: '/crane-2.png',
    3: '/crane-3.png',
}

const EquipmentMonitoring = () => {
    const { equipmentId } = useParams()
    const navigate = useNavigate()
    const isDarkMode = useStore((state) => state.isDarkMode)

    // Mode state: 'live', 'history', 'simulation'
    const [currentMode, setCurrentMode] = useState('live')
    // debug
    useEffect(() => console.log('Mode:', currentMode), [currentMode])

    const isHistoryMode = currentMode === 'history'
    const isSimulationMode = currentMode === 'simulation'

    // History/Simulation mode state
    const [selectedTimeRange, setSelectedTimeRange] = useState(TIME_RANGES[2]) // Default 1h
    const [isPlaying, setIsPlaying] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState(PLAYBACK_SPEEDS[0])
    const [playbackIndex, setPlaybackIndex] = useState(0)
    const [playbackProgress, setPlaybackProgress] = useState(0)
    const [currentPlaybackTime, setCurrentPlaybackTime] = useState(null)
    const [scenario, setScenario] = useState('container') // 'bulk' | 'container'
    const playbackRef = useRef(null)
    const [simulationData, setSimulationData] = useState([])

    // Generate simulation data for crane animation testing
    const generateSimulationData = useCallback(() => {
        console.log('[Simulation] Generating mock crane data...')
        const data = []
        const now = new Date()
        const frames = 300 // 5 minutes at 1 frame per second

        for (let i = 0; i < frames; i++) {
            const t = i / frames // 0 to 1 progress
            const time = new Date(now.getTime() - (frames - i) * 1000)

            // Create realistic crane movement patterns
            // Logic: Hoist Up and Luff Up (Boom In) when moving (Slew velocity high)
            //        Hoist Down and Luff Out (Boom Out) when stopped (dropping/picking load)

            const speedFactor = 4 // Oscillation speed
            const phase = t * Math.PI * speedFactor

            // Slew: Oscillates between -10° and -170° (displayed as 10-170°)
            const slewing = -(90 + Math.sin(phase) * 80)

            // Movement Factor: 1 when moving fast (middle of swing), 0 when stopped (ends of swing)
            const moveFactor = Math.abs(Math.cos(phase))

            // Radius: 15m (Up/In) when moving, 45m (Down/Out) when stopped
            // Luffed Up = Small Radius (~15m). Luffed Down = Large Radius (~45m).
            const radius = 45 - (30 * moveFactor)

            // Height: 40m (Up) when moving, 5m (Down) when stopped
            const height = 5 + (35 * moveFactor)

            // Load/Grabber Status:
            // User requirement: Open (Not Loaded) when slew is 0 or 180 (ends of swing)
            //                   Closed (Loaded) otherwise (middle of swing)
            // In our phase logic: moveFactor is 0 at ends (0/180), 1 in middle
            // So: if moveFactor < threshold -> Open (Load = 0). Else -> Closed (Load = 15)
            const load = moveFactor > 0.1 ? 15 : 0 // Open at ends of swing

            data.push({
                timestamp: time.toISOString(),
                data: {
                    Angle_d_orientation_superstructure_chassis_valeur_reelle: slewing,
                    Portee_en_metres_codeur_absolu: radius,
                    Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu: height,
                    Charge_nette_en_tonnes: load,
                    Vitesse_du_mec_levage_en_m_min: Math.abs(Math.cos(t * Math.PI * 5)) * 30
                }
            })
        }

        console.log('[Simulation] Generated', data.length, 'frames')
        return data
    }, [])

    // Get equipment port from mock data
    const equipmentData = mockData.equipment.find(eq => eq.id === equipmentId)
    const portId = equipmentData?.portId || 'SMA'  // Default to SMA if not found

    // Dynamic topic based on port/equipmentId format
    const dynamicTopic = `${portId}/${equipmentId}`

    // MQTT for live mode - enforce Real Data (useMock: false) with dynamic topic
    const { telemetry: mqttTelemetry, isConnected } = useMqtt(equipmentId, {
        useMock: false,
        topic: dynamicTopic
    })

    // Use topic discovery to get fallback data (already discovered)
    const { getEquipmentData, isEquipmentOnline } = useTopicDiscovery()
    const discoveredData = getEquipmentData(equipmentId)

    // Use MQTT data if available, otherwise fall back to discovered data
    const liveTelemetry = mqttTelemetry || discoveredData?.latestData || null

    // History hook
    const {
        historyData,
        isLoading: historyLoading,
        error: historyError,
        fetchHistoricalData
    } = useHistory()

    // Crane-specific history tags (from Angular TerexSupervision component)
    const CRANE_HISTORY_TAGS = [
        'Angle_d_orientation_superstructure_chassis_valeur_reelle',
        'Portee_en_metres_codeur_absolu',
        'Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu',
        'Charge_nette_en_tonnes',
        'Vitesse_du_mec_levage_en_m_min',
        'VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt',
        'Ruckmeldung_1_Spreader_gesteckt',
        'Ruckmeldung_Container_verriegelt',
        'Motorgreiferbetrieb'
    ]

    // Unified function to update crane state from telemetry (Live or History)
    const updateCraneFromTelemetry = useCallback((data) => {
        if (!data) return

        // 1. Rotation (Slewing)
        // Check for 'friendly' key (live) or raw key (history/sim)
        let angle = undefined
        if (data.angleOrientation !== undefined) angle = Number(data.angleOrientation)
        else if (data.Angle_d_orientation_superstructure_chassis_valeur_reelle !== undefined) angle = Number(data.Angle_d_orientation_superstructure_chassis_valeur_reelle)

        if (angle !== undefined) {
            // Convert angle to 0-180 range for display (assuming raw is -180 to 0 or similar)
            // Implementation matches previous logic: invert and normalize
            const normalizedAngle = ((-angle % 360) + 360) % 360
            setRotationValue(Math.min(180, Math.max(0, normalizedAngle)))
        }

        // 2. Luffing (Boom Radius)
        let radius = undefined
        if (data.porteeCodeurAbsolu !== undefined) radius = Number(data.porteeCodeurAbsolu)
        else if (data.Portee_en_metres_codeur_absolu !== undefined) radius = Number(data.Portee_en_metres_codeur_absolu)

        if (radius !== undefined) {
            const clampedRadius = Math.max(11, Math.min(51, radius))
            const luffingPercent = ((clampedRadius - 11) / (51 - 11)) * 100
            setLuffingValue(luffingPercent)
        }

        // 3. Hoisting (Hook Height)
        let height = undefined
        if (data.hauteurLevage !== undefined) height = Number(data.hauteurLevage)
        else if (data.Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu !== undefined) height = Number(data.Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu)

        if (height !== undefined) {
            const clampedHeight = Math.max(0, Math.min(47, height))
            // Invert: 0m = 100% rope out, 47m = 0% rope out
            const hoistPercent = ((47 - clampedHeight) / 47) * 100
            setHoistValue(hoistPercent)
        }

        // 4. Scenario Detection (Dynamic)
        const isSpreader = data.spreaderConnected || data.Ruckmeldung_1_Spreader_gesteckt
        const isTwinlift = data.twinliftConnected || data.VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt

        const isGrab = data.motorGrabActive || data.Motorgreiferbetrieb ||
            data.grabCmdClose || data.TK_Steuerhebel_Motorgreifer_Hubwerk2_Schlieen ||
            data.grabCmdOpen || data.TK_Steuerhebel_Motorgreifer_Hubwerk2_Offnen

        if (isSpreader || isTwinlift) {
            setScenario('container')
        } else {
            // Default to 'bulk' (Grab) if no Spreader/Twinlift explicitly detected
            // This matches user observation where 'Grab' is the physical reality when no spreader tags are active.
            // If we want to be stricter, we could check isGrab, but fallback seems safer given the telemetry dump.
            setScenario('bulk')
        }

        // 5. Load Status
        // Logic depends on scenario
        let loaded = false
        if (scenario === 'container') {
            loaded = Boolean(data.containerVerrouille || data.Ruckmeldung_Container_verriegelt)
        } else {
            // Bulk mode: check weight > 0.5t
            let weight = 0
            if (data.chargeNette !== undefined) weight = Number(data.chargeNette)
            else if (data.Charge_nette_en_tonnes !== undefined) weight = Number(data.Charge_nette_en_tonnes)
            loaded = weight > 0.5
        }
        setIsLoaded(loaded)

    }, [scenario]) // Re-run if scenario changes to update load logic correctness

    // Get equipment details
    const equipment = mockData.equipment.find(eq => eq.id === equipmentId) || {}
    const { craneType = 1, accessory: defaultAccessory = 'benne', notifications = 0, status: defaultStatus = 'off' } = equipment

    // Derive real-time status from telemetry
    const getLiveStatus = useCallback(() => {
        if (!liveTelemetry) return defaultStatus

        // Check if diesel engine is running (crane is active)
        const dieselRunning = liveTelemetry.dieselEnMarche || liveTelemetry.Uberwachung_Signal_Dieselmotor_in_Betrieb
        // Check if main switch is on
        const mainSwitchOn = liveTelemetry.kranHauptschalter || liveTelemetry.Kranhauptschalter_ist_EIN

        if (dieselRunning) return 'affected'
        if (mainSwitchOn) return 'standby'
        return 'off'
    }, [liveTelemetry, defaultStatus])

    // Derive real-time accessory from telemetry
    const getLiveAccessory = useCallback(() => {
        if (!liveTelemetry) return defaultAccessory

        // Check twinlift first (higher priority)
        if (liveTelemetry.twinliftConnected || liveTelemetry.VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt) return 'twinlift'
        // Then check spreader
        if (liveTelemetry.spreaderConnected || liveTelemetry.Ruckmeldung_1_Spreader_gesteckt) return 'spreader'
        // Default to benne (motor grab)
        return 'benne'
    }, [liveTelemetry, defaultAccessory])

    // Use live values in live mode, fallback to mock for history/simulation
    const status = currentMode === 'live' ? getLiveStatus() : defaultStatus
    const accessory = currentMode === 'live' ? getLiveAccessory() : defaultAccessory

    // Crane control states
    const [rotationValue, setRotationValue] = useState(45)
    const [luffingValue, setLuffingValue] = useState(50)
    const [hoistValue, setHoistValue] = useState(30)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isTelemetryExpanded, setIsTelemetryExpanded] = useState(false)

    // Animation - smooth value updates
    const [displayRotation, setDisplayRotation] = useState(45)
    const [displayLuffing, setDisplayLuffing] = useState(50)
    const [displayHoist, setDisplayHoist] = useState(30)

    // Current telemetry (live or from history playback)
    const [currentTelemetry, setCurrentTelemetry] = useState({})

    // Get data for playback (history or simulation)
    const playbackData = isSimulationMode ? simulationData : historyData

    // Load history data when switching to history mode
    useEffect(() => {
        if (isHistoryMode && selectedTimeRange) {
            console.log('[EquipmentMonitoring] Loading crane history for:', selectedTimeRange.label)
            fetchHistoricalData(selectedTimeRange, CRANE_HISTORY_TAGS)
            setPlaybackIndex(0)
            setPlaybackProgress(0)
            setIsPlaying(false)
        }
    }, [isHistoryMode, selectedTimeRange])

    // Generate simulation data when switching to simulation mode
    useEffect(() => {
        if (isSimulationMode) {
            console.log('[EquipmentMonitoring] Entering simulation mode')
            const data = generateSimulationData()
            setSimulationData(data)
            setPlaybackIndex(0)
            setPlaybackProgress(0)
            setIsPlaying(false)
            // Apply first frame immediately
            if (data.length > 0) {
                updateCraneFromTelemetry(data[0].data)
                setCurrentPlaybackTime(data[0].timestamp)
            }
        }
    }, [isSimulationMode, generateSimulationData, updateCraneFromTelemetry]) // Changed dependency

    // Apply first frame when history data loads
    useEffect(() => {
        if (isHistoryMode && historyData?.length > 0 && playbackIndex === 0) {
            const firstFrame = historyData[0]?.data || {}
            console.log('[EquipmentMonitoring] Applying first frame:', Object.keys(firstFrame))
            updateCraneFromTelemetry(firstFrame)
            setCurrentPlaybackTime(historyData[0]?.timestamp)
        }
    }, [isHistoryMode, historyData, playbackIndex, updateCraneFromTelemetry]) // Changed dependency

    // Playback timer (works for both history and simulation)
    useEffect(() => {
        const shouldPlay = (isHistoryMode || isSimulationMode) && isPlaying && playbackData?.length > 0
        if (shouldPlay) {
            playbackRef.current = setInterval(() => {
                setPlaybackIndex(prev => {
                    const next = prev + 1
                    if (next >= (playbackData?.length || 0)) {
                        setIsPlaying(false)
                        return prev
                    }
                    setPlaybackProgress((next / ((playbackData?.length || 1) - 1)) * 100)
                    if (playbackData[next]) {
                        const frameData = playbackData[next].data || {}
                        setCurrentTelemetry(frameData)
                        setCurrentPlaybackTime(playbackData[next].timestamp)
                        updateCraneFromTelemetry(frameData)
                    }
                    return next
                })
            }, 1000 / playbackSpeed.value)
        }
        return () => {
            if (playbackRef.current) clearInterval(playbackRef.current)
        }
    }, [isHistoryMode, isSimulationMode, isPlaying, playbackData, playbackSpeed, updateCraneFromTelemetry]) // Changed dependency

    // Sync telemetry from live mode only
    useEffect(() => {
        if (currentMode === 'live' && liveTelemetry) {
            setCurrentTelemetry(liveTelemetry)
            updateCraneFromTelemetry(liveTelemetry)
        }
    }, [currentMode, liveTelemetry, updateCraneFromTelemetry])

    // Animate towards target values
    useEffect(() => {
        const animate = () => {
            setDisplayRotation(prev => prev + (rotationValue - prev) * 0.1)
            setDisplayLuffing(prev => prev + (luffingValue - prev) * 0.1)
            setDisplayHoist(prev => prev + (hoistValue - prev) * 0.1)
        }
        const interval = setInterval(animate, 16)
        return () => clearInterval(interval)
    }, [rotationValue, luffingValue, hoistValue])

    // Control handlers
    const rotateLeft = () => setRotationValue(prev => Math.max(0, prev - 5))
    const rotateRight = () => setRotationValue(prev => Math.min(180, prev + 5))
    const luffUp = () => setLuffingValue(prev => Math.max(0, prev - 5))
    const luffDown = () => setLuffingValue(prev => Math.min(100, prev + 5))
    const raiseHook = () => setHoistValue(prev => Math.max(0, prev - 5))
    const lowerHook = () => setHoistValue(prev => Math.min(100, prev + 5))
    const toggleLoad = () => setIsLoaded(prev => !prev)

    // Playback controls
    const togglePlayback = () => setIsPlaying(prev => !prev)
    const skipBackward = () => {
        const newIndex = Math.max(0, playbackIndex - 10)
        setPlaybackIndex(newIndex)
        setPlaybackProgress((newIndex / ((playbackData?.length || 1) - 1)) * 100)
        if (playbackData?.[newIndex]) {
            const frameData = playbackData[newIndex].data || {}
            setCurrentTelemetry(frameData)
            setCurrentPlaybackTime(playbackData[newIndex].timestamp)
            updateCraneFromTelemetry(frameData)
        }
    }
    const skipForward = () => {
        const newIndex = Math.min((playbackData?.length || 1) - 1, playbackIndex + 10)
        setPlaybackIndex(newIndex)
        setPlaybackProgress((newIndex / ((playbackData?.length || 1) - 1)) * 100)
        if (playbackData?.[newIndex]) {
            const frameData = playbackData[newIndex].data || {}
            setCurrentTelemetry(frameData)
            setCurrentPlaybackTime(playbackData[newIndex].timestamp)
            updateCraneFromTelemetry(frameData)
        }
    }

    // Calculate visual positions
    // Slewing: 0° = scaleX(1), 90° = scaleX(0), 180° = scaleX(-1)
    const slewScaleX = 1 - (displayRotation / 90)

    // Luffing: arm angle (-9° to +21°)
    const luffAngle = -9 + (displayLuffing / 100) * 30

    // Hoisting: rope length in pixels
    const ropeLength = 170 + (displayHoist / 100) * 80

    // Rope position based on luffing (+ hoisting)
    // Min (0%): top 1%, left 1%
    // Max (100%): top 36%, left 11%
    const ropeTop = -20 + (displayLuffing / 100) * 41 + (displayHoist / 100) * 10
    const ropeLeft = 64 + (displayLuffing / 100) * 17

    const currentHeight = (47 * (1 - displayHoist / 100)).toFixed(1)

    // Status config
    const statusColors = {
        off: { bg: 'bg-gray-500', text: 'text-gray-400' },
        standby: { bg: 'bg-amber-500', text: 'text-amber-400' },
        affected: { bg: 'bg-green-500', text: 'text-green-400' },
        maintenance: { bg: 'bg-blue-500', text: 'text-blue-400' },
    }
    const currentStatusColor = statusColors[status] || statusColors.off

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#1a2035]' : 'bg-gray-100'}`}>
            {/* Header Bar */}
            <div className={`px-4 py-3 flex items-center justify-between ${isDarkMode ? 'bg-[#1a365d]' : 'bg-primary'} text-white`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="text-lg font-semibold tracking-wide">PORT CRANE MONITORING SYSTEM</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Notifications - Click to view */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 transition-colors cursor-pointer"
                    >
                        <Bell size={16} className="text-amber-400" />
                        <span className="text-sm font-bold text-amber-400">{notifications || 0}</span>
                    </button>

                    {/* Mode Toggle - Live/History/Simulation */}
                    <div className="flex bg-[#1a2035] rounded-lg p-1 border border-indigo-500/30">
                        <button
                            onClick={() => setCurrentMode('live')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentMode === 'live'
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Wifi size={14} />
                                <span>Live</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setCurrentMode('history')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentMode === 'history'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <History size={14} />
                                <span>History</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setCurrentMode('simulation')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentMode === 'simulation'
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Activity size={14} />
                                <span>Sim</span>
                            </div>
                        </button>
                    </div>

                    {/* Scenario Toggle */}
                    <div className="flex bg-[#1a2035] rounded-lg p-1 border border-indigo-500/30 ml-2">
                        <button
                            onClick={() => setScenario(scenario === 'bulk' ? 'container' : 'bulk')}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Switch Scenario"
                        >
                            {scenario === 'bulk' ? '🏗️ Bulk' : '🚢 Container'}
                        </button>
                    </div>

                </div>

                <div className="flex flex-col items-end">
                    {/* Time Range Selector (History mode only) */}
                    {isHistoryMode && (
                        <select
                            value={selectedTimeRange.label}
                            onChange={(e) => {
                                const range = TIME_RANGES.find(r => r.label === e.target.value)
                                if (range) setSelectedTimeRange(range)
                            }}
                            className="px-2 py-1 rounded bg-white/10 text-sm border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                            {TIME_RANGES.map(range => (
                                <option key={range.label} value={range.label} className="bg-gray-800">
                                    {range.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Connection/Mode Status */}
                    <div className="flex items-center gap-2">
                        {currentMode === 'simulation' ? (
                            <>
                                <Activity size={14} className="text-purple-400" />
                                <span className="text-sm text-purple-300">
                                    {simulationData?.length || 0} frames
                                </span>
                            </>
                        ) : currentMode === 'history' ? (
                            <>
                                <Calendar size={14} className="text-blue-400" />
                                <span className="text-sm text-blue-300">
                                    {historyLoading ? 'Loading...' : `${historyData?.length || 0} points`}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-sm">{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
                            </>
                        )}
                    </div>

                    {/* Equipment Code */}
                    <div className="px-3 py-1 rounded bg-white/10 text-sm">
                        Code: {equipmentId}
                    </div>
                </div>
            </div>

            {/* Playback Bar (history or simulation mode) */}
            {(isHistoryMode || isSimulationMode) && playbackData?.length > 0 && (
                <div className={`px-4 py-2 flex items-center gap-4 ${isDarkMode ? 'bg-[#1a365d]/80' : 'bg-primary/80'} text-white`}>
                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                        <button onClick={skipBackward} className="p-1.5 rounded hover:bg-white/10">
                            <SkipBack size={18} />
                        </button>
                        <button
                            onClick={togglePlayback}
                            className="p-2 rounded-full bg-white/20 hover:bg-white/30"
                        >
                            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                        </button>
                        <button onClick={skipForward} className="p-1.5 rounded hover:bg-white/10">
                            <SkipForward size={18} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-400 transition-all duration-200"
                            style={{ width: `${playbackProgress}%` }}
                        />
                    </div>

                    {/* Speed Selector */}
                    <select
                        value={playbackSpeed.label}
                        onChange={(e) => {
                            const speed = PLAYBACK_SPEEDS.find(s => s.label === e.target.value)
                            if (speed) setPlaybackSpeed(speed)
                        }}
                        className="px-2 py-1 rounded bg-white/10 text-xs border border-white/20"
                    >
                        {PLAYBACK_SPEEDS.map(speed => (
                            <option key={speed.label} value={speed.label} className="bg-gray-800">
                                {speed.label}
                            </option>
                        ))}
                    </select>

                    {/* Timestamp Display */}
                    <div className="text-xs text-white/70">
                        {currentPlaybackTime
                            ? new Date(currentPlaybackTime).toLocaleString()
                            : 'Select time'
                        }
                    </div>
                </div>
            )}
            {/* Equipment Info Card */}
            <div className="p-4 mt-4">
                <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-[#222b45]' : 'bg-white shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-100'}`}>
                            <img src={craneImages[craneType]} alt="Crane" className="w-16 h-16 object-contain" />
                        </div>
                        <div className="flex-1">
                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{equipmentId}</h2>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{equipment.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <div className={`w-2 h-2 rounded-full ${currentStatusColor.bg}`} />
                                <span className={`text-sm font-medium ${currentStatusColor.text}`}>{status.toUpperCase()}</span>
                                <span className={`ml-auto text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    {accessory.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOCK 2: Crane Visualization */}
            <div className="px-4">
                <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-[#222b45]' : 'bg-white shadow-sm'}`}>
                    <div className="grid grid-cols-2 gap-6">

                        {/* Top View - Slewing */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    TOP VIEW - SLEWING
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDarkMode ? 'bg-[#1a2035] text-cyan-400' : 'bg-gray-100 text-gray-600'}`}>
                                    {displayRotation.toFixed(1)}°
                                </span>
                            </div>

                            {/* Rotation Tracker - Circular area with ocean/terminal */}
                            <div className="relative w-full max-w-sm mx-auto rounded-full overflow-hidden border-2 border-gray-600/50" style={{ aspectRatio: '1/1' }}>
                                {/* Ocean half (right side) */}
                                <div className="absolute top-0 right-0 w-1/3 h-full overflow-hidden">
                                    <img src="/ocean-water.jpg" alt="Ocean" className="w-full h-full object-cover" />
                                </div>

                                {/* Terminal half (left side - dark) */}
                                <div className={`absolute top-0 left-0 w-2/3 h-full ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-gray-700'}`} />

                                {/* Concentric circles */}
                                <div className="absolute inset-8 border border-dashed border-white/15 rounded-full" />
                                <div className="absolute inset-16 border border-dashed border-white/15 rounded-full" />
                                <div className="absolute inset-24 border border-dashed border-white/15 rounded-full" />

                                {/* Compass directions */}
                                <span className="absolute top-3 left-1/2 -translate-x-1/2 text-sm font-bold text-white/80">N</span>
                                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm font-bold text-white/80">S</span>
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/80">W</span>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/80">E</span>

                                {/* Base + Tower Container (stationary center) */}
                                <div
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '25%',
                                        height: '25%'
                                    }}
                                >
                                    {/* Base (stationary) */}
                                    <img
                                        src="/base-top.png"
                                        alt="Base"
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />

                                    {/* Upper structure - Tower + Arm (slewing rotation) */}
                                    <div
                                        className="absolute"
                                        style={{
                                            top: '50%',
                                            left: '50%',
                                            width: '250%',
                                            height: '100%',
                                            transformOrigin: 'left center',
                                            transform: `translate(0, -50%) rotate(${displayRotation}deg)`,
                                            transition: 'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
                                        }}
                                    >
                                        <img
                                            src="/crane-upper-top.png"
                                            alt="Crane Arm"
                                            style={{ width: '80%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Slider */}
                            <div className="mt-4 px-4">
                                <input
                                    type="range"
                                    min="0"
                                    max="180"
                                    value={rotationValue}
                                    onChange={(e) => setRotationValue(Number(e.target.value))}
                                    className="w-full accent-cyan-500"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>0°</span>
                                    <span>180°</span>
                                </div>
                            </div>
                        </div>

                        {/* Side View - Luffing & Hoisting */}
                        <div>
                            <div className="flex items-center justify-between mb-4 ">
                                <h3 className={`text-sm font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    SIDE VIEW - LUFFING & HOISTING
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium  ${isDarkMode ? 'bg-[#1a2035] text-cyan-400' : 'bg-gray-100 text-gray-600'}`}>
                                    {displayLuffing.toFixed(0)}%
                                </span>
                            </div>

                            {/* Side View Scene Container */}
                            <div className={`relative rounded-lg overflow-hidden ${isDarkMode ? 'bg-[#0a0a14]' : 'bg-sky-100'}`} style={{ aspectRatio: '16/9' }}>

                                {/* Terminal/Quay (dark platform) */}
                                <div className={`absolute bottom-0 left-0 w-1/2 ${isDarkMode ? 'bg-[#1a1a2e]' : 'bg-gray-800'}`} style={{ height: '12%', zIndex: 10 }}>
                                    {/* Quay edge pattern */}
                                    <div className="absolute top-0 right-0 w-3 h-full bg-yellow-600/50" />
                                </div>

                                {/* Ocean */}
                                <div className="absolute bottom-0 right-0 w-1/2 overflow-hidden" style={{ height: '12%' }}>
                                    <img src="/ocean-water.jpg" alt="Water" className="w-full h-full object-cover" />
                                </div>

                                {/* Vessel - Switch based on scenario */}
                                <img
                                    src={scenario === 'container' ? "/vessel-container.jpg" : "/vessel.png"}
                                    alt="Vessel"
                                    className="absolute"
                                    style={{
                                        bottom: '8%',
                                        right: scenario === 'container' ? '21%' : '19%', // Adjust position for different assets
                                        width: scenario === 'container' ? '25%' : '29%',
                                        height: 'auto',
                                        zIndex: 50
                                    }}
                                />

                                {/* ===== CRANE CONTAINER ===== */}
                                <div
                                    className="absolute"
                                    style={{
                                        bottom: '12%',
                                        left: '4%',
                                        width: '70%',
                                        height: '85%',
                                        zIndex: 60
                                    }}
                                >
                                    {/* BASE Container (static, sits on ground) */}
                                    <div
                                        className="absolute"
                                        style={{
                                            bottom: '0',
                                            left: '0',
                                            width: '80%',
                                            height: '25%',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'flex-end',
                                            zIndex: 2
                                        }}
                                    >
                                        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                            <img
                                                src="/crane-base.png"
                                                alt="Base"
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>
                                    </div>

                                    {/* UPPER PART Container (slewing: scaleX -1 to 1) */}
                                    <div
                                        className="absolute"
                                        style={{
                                            bottom: '16%',
                                            left: '20%',
                                            width: '80%',
                                            height: '90%',
                                            transformOrigin: '24% 50%',
                                            transform: `scaleX(${slewScaleX})`,
                                            transition: 'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
                                        }}
                                    >
                                        {/* SLEW Label */}
                                        <div
                                            className="absolute"
                                            style={{
                                                bottom: '5%',
                                                left: '15%',
                                                fontSize: '10px',
                                                color: '#22d3ee',
                                                background: 'rgba(0,0,0,0.7)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                whiteSpace: 'nowrap',
                                                transform: `scaleX(${slewScaleX})`,
                                                zIndex: 30
                                            }}
                                        >
                                            SLEW: {displayRotation.toFixed(1)}°
                                        </div>
                                        {/* TOWER Container */}
                                        <div
                                            className="absolute"
                                            style={{
                                                bottom: 0,
                                                left: '7%',
                                                width: '31%',
                                                height: '100%',
                                                transition: 'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
                                            }}
                                        >
                                            <img
                                                src="/crane-tower.png"
                                                alt="Tower"
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            />
                                        </div>

                                        {/* ARM + ROPE Container (visual grouping only) */}
                                        <div
                                            className="absolute"
                                            style={{
                                                top: '1%',
                                                left: '12%',
                                                width: '80%',
                                                height: '50%',
                                            }}
                                        >
                                            {/* ARM (luffing rotation) */}
                                            <div
                                                className="absolute"
                                                style={{
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    transformOrigin: 'left bottom',
                                                    transform: `rotate(${luffAngle}deg)`,
                                                    transition: 'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                                    zIndex: 2
                                                }}
                                            >
                                                <img
                                                    src="/crane-arm.png"
                                                    alt="Arm"
                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                />

                                                {/* LUFF Label */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '30%',
                                                    fontSize: '10px',
                                                    color: '#f59e0b',
                                                    background: 'rgba(0,0,0,0.7)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    whiteSpace: 'nowrap',
                                                    transform: `rotate(${-luffAngle}deg)`,
                                                    zIndex: 30
                                                }}>
                                                    LUFF: {luffAngle.toFixed(1)}°
                                                </div>

                                                {/* ROPE + ACCESSORY (anchored to arm tip, counter-rotates to stay vertical) */}
                                                <div
                                                    className="absolute"
                                                    style={{
                                                        top: '5%',
                                                        right: '13%',
                                                        width: '15%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        transformOrigin: 'top center',
                                                        transform: `rotate(${-luffAngle}deg)`,
                                                        transition: 'transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                                        zIndex: 20
                                                    }}
                                                >
                                                    {/* Rope */}
                                                    <div
                                                        style={{
                                                            width: '3px',
                                                            height: `${ropeLength}px`,
                                                            backgroundColor: '#333',
                                                            transition: 'height 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)'
                                                        }}
                                                    />

                                                    {/* ACCESSORY - Switch based on scenario & load status */}
                                                    {/* ACCESSORY - Switch based on scenario & load status */}
                                                    <img
                                                        src={
                                                            scenario === 'container'
                                                                ? (isLoaded ? '/spreader-container.png' : '/spreader-only.png')
                                                                : (isLoaded ? '/crane-grabber-closed.svg' : '/crane-grabber-opened.svg')
                                                        }
                                                        alt={accessory}
                                                        style={{ width: '100%', height: 'auto', marginTop: '-2px' }}
                                                    />

                                                    {/* HOIST Label */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        fontSize: '10px',
                                                        color: '#22d3ee',
                                                        background: 'rgba(0,0,0,0.7)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        whiteSpace: 'nowrap',
                                                        marginTop: '4px'
                                                    }}>
                                                        HOIST: {displayHoist.toFixed(0)}%
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Control Panel */}
                    <div className={`mt-4 rounded-xl p-4 ${isDarkMode ? 'bg-[#222b45]' : 'bg-white shadow-sm'}`}>
                        <div className="grid grid-cols-4 gap-4">
                            {/* Slewing Controls */}
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <RotateCcw size={18} className="text-primary" />
                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>SLEWING</span>
                                    <span className={`ml-auto text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{displayRotation.toFixed(1)}°</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={rotateLeft} className="flex-1 py-2 px-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors flex items-center justify-center gap-1">
                                        <RotateCcw size={16} /> LEFT
                                    </button>
                                    <button onClick={rotateRight} className="flex-1 py-2 px-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors flex items-center justify-center gap-1">
                                        RIGHT <RotateCw size={16} />
                                    </button>
                                </div>
                                <div className={`mt-2 h-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(rotationValue / 180) * 100}%` }} />
                                </div>
                            </div>

                            {/* Luffing Controls */}
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <ArrowDownUp size={18} className="text-amber-500" />
                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LUFFING</span>
                                    <span className={`ml-auto text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{displayLuffing.toFixed(0)}%</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={luffUp} className="flex-1 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-lg transition-colors flex items-center justify-center gap-1">
                                        <ChevronUp size={16} /> UP
                                    </button>
                                    <button onClick={luffDown} className="flex-1 py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-lg transition-colors flex items-center justify-center gap-1">
                                        DOWN <ChevronDown size={16} />
                                    </button>
                                </div>
                                <div className={`mt-2 h-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${luffingValue}%` }} />
                                </div>
                            </div>

                            {/* Hoisting Controls */}
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <ArrowUpDown size={18} className="text-cyan-500" />
                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>HOISTING</span>
                                    <span className={`ml-auto text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{displayHoist.toFixed(0)}%</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={raiseHook} className="flex-1 py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-500 rounded-lg transition-colors flex items-center justify-center gap-1">
                                        <ChevronsUp size={16} /> RAISE
                                    </button>
                                    <button onClick={lowerHook} className="flex-1 py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-500 rounded-lg transition-colors flex items-center justify-center gap-1">
                                        LOWER <ChevronsDown size={16} />
                                    </button>
                                </div>
                                <div className={`mt-2 h-1 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                    <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${hoistValue}%` }} />
                                </div>
                            </div>

                            {/* Load Control */}
                            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Box size={18} className="text-green-500" />
                                    <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LOAD STATUS</span>
                                    <span className={`ml-auto text-xs font-bold ${isLoaded ? 'text-green-500' : 'text-gray-400'}`}>
                                        {isLoaded ? 'ATTACHED' : 'DETACHED'}
                                    </span>
                                </div>
                                <button
                                    onClick={toggleLoad}
                                    className={`w-full py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${isLoaded
                                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500'
                                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-500'
                                        }`}
                                >
                                    {isLoaded ? <Unlock size={16} /> : <Lock size={16} />}
                                    {isLoaded ? 'RELEASE LOAD' : 'ATTACH LOAD'}
                                </button>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-gray-500'}`} />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {isLoaded ? 'LOAD SECURED' : 'AWAITING LOAD'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOCK 3: Metrics & Real-time Data Section */}
            <div className="px-4 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                {/* Real-time Metrics */}
                <div className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-[#222b45]' : 'bg-white shadow-sm'}`}>
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'bg-[#1a2035] border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                        <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            <Activity size={16} className="text-primary" />
                            REAL-TIME MONITORING
                        </h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-4">
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Gauge size={16} className="text-primary" />
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>HOISTING SPEED</span>
                            </div>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {((100 - displayHoist) / 10).toFixed(1)} <span className="text-sm font-normal text-gray-400">m/s</span>
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <RotateCw size={16} className="text-amber-500" />
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>SLEWING ANGLE</span>
                            </div>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {displayRotation.toFixed(1)} <span className="text-sm font-normal text-gray-400">°</span>
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowDownUp size={16} className="text-cyan-500" />
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>LUFFING ANGLE</span>
                            </div>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {luffAngle.toFixed(1)} <span className="text-sm font-normal text-gray-400">°</span>
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <ArrowUpDown size={16} className="text-green-500" />
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>HEIGHT</span>
                            </div>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {currentHeight} <span className="text-sm font-normal text-gray-400">m</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Telemetry Data - Expandable */}
                <div className={`rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-[#222b45]' : 'bg-white shadow-sm'} ${isTelemetryExpanded ? 'lg:col-span-2' : ''}`}>
                    {/* Clickable Header */}
                    <div
                        className={`px-4 py-3 border-b ${isDarkMode ? 'bg-[#1a2035] border-gray-700' : 'bg-gray-50 border-gray-100'}`}
                    >
                        <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            <Wifi size={16} className="text-green-500" />
                            TELEMETRY DATA
                            <button
                                onClick={() => navigate(`/telemetry/${equipmentId}`)}
                                className="ml-auto px-3 py-1 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors"
                            >
                                Full Dashboard
                            </button>
                        </h3>
                    </div>

                    {/* Collapsed View - Simple metrics */}
                    {!isTelemetryExpanded && (
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Fuel size={16} className="text-amber-500" />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>FUEL LEVEL</span>
                                </div>
                                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {currentTelemetry ? Math.round(currentTelemetry.fuelLevel || 0) : '—'} <span className="text-sm font-normal text-gray-400">%</span>
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Weight size={16} className="text-primary" />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>LOAD WEIGHT</span>
                                </div>
                                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {currentTelemetry ? (currentTelemetry.loadWeight || 0).toFixed(1) : '—'} <span className="text-sm font-normal text-gray-400">t</span>
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Wind size={16} className="text-cyan-500" />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>WIND SPEED</span>
                                </div>
                                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {currentTelemetry ? Math.round(currentTelemetry.windSpeed || 0) : '—'} <span className="text-sm font-normal text-gray-400">m/s</span>
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Thermometer size={16} className="text-red-500" />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>OIL TEMP</span>
                                </div>
                                <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {currentTelemetry ? (currentTelemetry.hydraulicTemp || 0).toFixed(1) : '—'} <span className="text-sm font-normal text-gray-400">°C</span>
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Expanded Dashboard */}
                    {isTelemetryExpanded && (
                        <div className="p-4">
                            {/* Load & Safety */}
                            <div className="mb-6">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Weight size={14} className="text-green-500" /> Load & Safety
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[190px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <SemiGauge
                                            value={currentTelemetry?.loadWeight ? (currentTelemetry.loadWeight / 41) * 100 : 50}
                                            title="Charge Nette"
                                            unit="%"
                                            size={120}
                                        />
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                            <Wind size={14} /> Wind Speed
                                        </div>
                                        <div className={`text-4xl font-bold ${(currentTelemetry?.windSpeed || 0) >= 15 ? 'text-red-500' :
                                            (currentTelemetry?.windSpeed || 0) >= 8 ? 'text-amber-500' : 'text-green-500'
                                            }`} style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                                            {currentTelemetry ? (currentTelemetry.windSpeed || 0).toFixed(1) : '—'}
                                            <span className="text-base ml-1.5 font-medium text-gray-400">m/s</span>
                                        </div>
                                        <div className={`mt-3 text-xs font-bold px-3 py-1.5 rounded-full ${(currentTelemetry?.windSpeed || 0) >= 15 ? 'bg-red-500/20 text-red-400' :
                                            (currentTelemetry?.windSpeed || 0) >= 8 ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {(currentTelemetry?.windSpeed || 0) >= 15 ? 'DANGER' : (currentTelemetry?.windSpeed || 0) >= 8 ? 'WARNING' : 'SAFE'}
                                        </div>
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Hauteur Levage</div>
                                        <div className="w-12 h-24 bg-black/40 rounded-lg relative overflow-hidden border border-gray-600">
                                            <div
                                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 to-green-400 transition-all"
                                                style={{ height: `${Math.min(100, displayHoist)}%` }}
                                            />
                                            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-lg">
                                                {Math.round(displayHoist)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Fuel Level</div>
                                        <div className="w-14 h-20 bg-black/40 rounded-xl rounded-b-3xl relative overflow-hidden border-2 border-gray-600">
                                            <div
                                                className={`absolute bottom-0 left-0 right-0 transition-all ${(currentTelemetry?.fuelLevel || 0) > 50 ? 'bg-gradient-to-t from-green-500 to-green-400' :
                                                    (currentTelemetry?.fuelLevel || 0) > 20 ? 'bg-gradient-to-t from-amber-500 to-amber-400' :
                                                        'bg-gradient-to-t from-red-500 to-red-400'
                                                    }`}
                                                style={{ height: `${currentTelemetry?.fuelLevel || 0}%` }}
                                            />
                                            <Fuel size={18} className="absolute top-2 left-1/2 -translate-x-1/2 text-white/40" />
                                            <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white font-bold text-sm drop-shadow-lg">
                                                {Math.round(currentTelemetry?.fuelLevel || 0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hydraulics */}
                            <div className="mb-6">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Droplets size={14} className="text-blue-500" /> Hydraulics
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <SemiGauge
                                            value={currentTelemetry?.hydraulicTemp || 45}
                                            min={10}
                                            max={90}
                                            title="Temp. Hydraulique"
                                            unit="°C"
                                            size={120}
                                        />
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <SemiGauge
                                            value={Math.random() * 350}
                                            min={0}
                                            max={350}
                                            title="Pression Pompe"
                                            unit=" bar"
                                            size={120}
                                        />
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Frein Levage</div>
                                        <div className="text-4xl font-bold text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                                            {(Math.random() * 150).toFixed(0)}
                                        </div>
                                        <div className="text-sm font-medium text-gray-400 mt-1">bar</div>
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Frein Orient.</div>
                                        <div className="text-4xl font-bold text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                                            {(Math.random() * 150).toFixed(0)}
                                        </div>
                                        <div className="text-sm font-medium text-gray-400 mt-1">bar</div>
                                    </div>
                                </div>
                            </div>

                            {/* Engine & Electrical */}
                            <div className="mb-6">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500" /> Engine & Electrical
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                                            <Thermometer size={14} /> Engine Temp
                                        </div>
                                        <div className="w-8 h-20 bg-black/40 rounded-full relative overflow-hidden border border-gray-600">
                                            <div
                                                className="absolute bottom-0 left-0 right-0 rounded-full transition-all"
                                                style={{
                                                    height: `${(currentTelemetry?.hydraulicTemp || 50) / 110 * 100}%`,
                                                    background: `linear-gradient(to top, ${(currentTelemetry?.hydraulicTemp || 50) > 85 ? '#ef4444' :
                                                        (currentTelemetry?.hydraulicTemp || 50) > 60 ? '#f97316' : '#22c55e'
                                                        }, ${(currentTelemetry?.hydraulicTemp || 50) > 85 ? '#dc2626' :
                                                            (currentTelemetry?.hydraulicTemp || 50) > 60 ? '#ea580c' : '#16a34a'
                                                        })`
                                                }}
                                            />
                                        </div>
                                        <div className="text-lg font-bold text-white mt-2" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                                            {currentTelemetry?.hydraulicTemp?.toFixed(0) || 50}°C
                                        </div>
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Tension Moteur</div>
                                        <div className="text-4xl font-bold text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                                            {(380 + Math.random() * 20).toFixed(0)}
                                        </div>
                                        <div className="text-sm font-medium text-gray-400 mt-1">V</div>
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Fréquence</div>
                                        <div className="text-4xl font-bold text-green-400" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                                            {(49.5 + Math.random()).toFixed(1)}
                                        </div>
                                        <div className="text-sm font-medium text-gray-400 mt-1">Hz</div>
                                    </div>
                                    <div className={`p-5 rounded-xl flex flex-col items-center justify-center min-h-[140px] ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3">Puissance</div>
                                        <div className="text-4xl font-bold text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                                            {(100 + Math.random() * 200).toFixed(0)}
                                        </div>
                                        <div className="text-sm font-medium text-gray-400 mt-1">kW</div>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Settings size={14} className="text-purple-500" /> Status
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className={`p-3 rounded-lg flex items-center gap-2 ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50'}`}>
                                        <Power size={16} className="text-green-500" />
                                        <div>
                                            <div className="text-xs text-gray-400">Diesel</div>
                                            <div className="text-sm font-bold text-green-500">RUNNING</div>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-2 ${isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50'}`}>
                                        <Power size={16} className="text-green-500" />
                                        <div>
                                            <div className="text-xs text-gray-400">Main Switch</div>
                                            <div className="text-sm font-bold text-green-500">ON</div>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-2 ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <Box size={16} className="text-gray-500" />
                                        <div>
                                            <div className="text-xs text-gray-400">Spreader</div>
                                            <div className="text-sm font-bold text-gray-400">DETACHED</div>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-2 ${isLoaded ? (isDarkMode ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50') : (isDarkMode ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-amber-50')}`}>
                                        <Lock size={16} className={isLoaded ? 'text-green-500' : 'text-amber-500'} />
                                        <div>
                                            <div className="text-xs text-gray-400">Container</div>
                                            <div className={`text-sm font-bold ${isLoaded ? 'text-green-500' : 'text-amber-500'}`}>
                                                {isLoaded ? 'LOCKED' : 'UNLOCKED'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-lg flex items-center gap-2 ${isDarkMode ? 'bg-[#2a3555]' : 'bg-gray-50'}`}>
                                        <Clock size={16} className="text-gray-400" />
                                        <div>
                                            <div className="text-xs text-gray-400">Hours</div>
                                            <div className="text-sm font-bold text-amber-500 font-mono">12,456</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    )
}

export default EquipmentMonitoring
