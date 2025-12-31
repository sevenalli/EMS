import { useNavigate } from 'react-router-dom'
import { useStore, mockData } from '../store/store'
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
    AlertCircle
} from 'lucide-react'
import { useState, useMemo } from 'react'

const Dashboard = () => {
    const navigate = useNavigate()
    const { selectedPort, selectedEquipment, isDarkMode } = useStore()
    const [gridSize, setGridSize] = useState('normal')
    const [isRefreshing, setIsRefreshing] = useState(false)

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

    // Build equipment list: combine mock data with live MQTT status
    const equipmentList = useMemo(() => {
        // If we have online equipment from MQTT, prioritize those
        if (onlineEquipmentCodes.length > 0) {
            // Get active equipment from MQTT
            const activeList = onlineEquipmentCodes.map(code => {
                // Check if it exists in mock data
                const mockEntry = mockData.equipment.find(eq => eq.id === code)
                const mqttData = getEquipmentData(code)

                return {
                    id: code,
                    name: mockEntry?.name || `Equipment ${code}`,
                    categoryId: mockEntry?.categoryId || 'grue-mobile',
                    portId: mqttData?.port || selectedPort?.id || 'SMA',
                    status: 'active',  // Active since it's online
                    craneType: mockEntry?.craneType || 1,
                    accessory: mockEntry?.accessory || 'benne',
                    notifications: mockEntry?.notifications || 0,
                    isOnline: true,
                    mqttData: mqttData?.latestData
                }
            })
            return activeList
        }

        // Fallback to selected equipment from mock data (with online status)
        if (selectedEquipment.length > 0) {
            return mockData.equipment
                .filter(eq => selectedEquipment.includes(eq.id))
                .map(eq => ({
                    ...eq,
                    isOnline: isEquipmentOnline(eq.id),
                    mqttData: getEquipmentData(eq.id)?.latestData
                }))
        }

        // Default: show first 4 equipment with online status
        return mockData.equipment.slice(0, 4).map(eq => ({
            ...eq,
            isOnline: isEquipmentOnline(eq.id),
            mqttData: getEquipmentData(eq.id)?.latestData
        }))
    }, [onlineEquipmentCodes, selectedEquipment, selectedPort, isEquipmentOnline, getEquipmentData])

    const handleRefresh = () => {
        setIsRefreshing(true)
        setTimeout(() => setIsRefreshing(false), 1000)
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

                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                className={`p-2.5 rounded-lg transition-all ${isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:text-white'
                                    : 'bg-white shadow-sm text-gray-500 hover:text-gray-700'
                                    }`}
                                title="Rafraîchir"
                            >
                                <RefreshCw
                                    size={18}
                                    className={isRefreshing ? 'animate-spin' : ''}
                                />
                            </button>

                            {/* Settings Button */}
                            <button
                                className={`p-2.5 rounded-lg transition-all ${isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:text-white'
                                    : 'bg-white shadow-sm text-gray-500 hover:text-gray-700'
                                    }`}
                                title="Paramètres"
                            >
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Equipment Grid */}
                {equipmentList.length > 0 ? (
                    <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                        {equipmentList.map((equipment) => (
                            <EquipmentCard
                                key={equipment.id}
                                equipmentId={equipment.id}
                                initialStatus={equipment.status}
                                isOnline={equipment.isOnline}
                                mqttData={equipment.mqttData}
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
        </div>
    )
}

export default Dashboard
