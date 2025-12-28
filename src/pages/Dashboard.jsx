import { useNavigate } from 'react-router-dom'
import { useStore, mockData } from '../store/store'
import EquipmentCard from '../components/EquipmentCard'
import {
    ChevronLeft,
    RefreshCw,
    Settings,
    Maximize2,
    Grid3X3,
    LayoutGrid,
    Activity
} from 'lucide-react'
import { useState } from 'react'

const Dashboard = () => {
    const navigate = useNavigate()
    const { selectedPort, selectedEquipment, isDarkMode } = useStore()
    const [gridSize, setGridSize] = useState('normal')
    const [isRefreshing, setIsRefreshing] = useState(false)

    const equipmentList = selectedEquipment.length > 0
        ? mockData.equipment.filter(eq => selectedEquipment.includes(eq.id))
        : mockData.equipment.slice(0, 4)

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
                <div className={`grid ${gridClasses[gridSize]} gap-6`}>
                    {equipmentList.map((equipment) => (
                        <EquipmentCard
                            key={equipment.id}
                            equipmentId={equipment.id}
                            initialStatus={equipment.status}
                        />
                    ))}
                </div>

                {/* Stats Footer */}
                <div className={`mt-12 rounded-2xl p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                    }`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-green-500 mb-1">
                                {equipmentList.filter(eq => eq.status === 'active').length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actifs</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-3xl font-bold mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {equipmentList.filter(eq => eq.status === 'inactive').length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Inactifs</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-red-500 mb-1">
                                {equipmentList.filter(eq => eq.status === 'alarm').length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Alarmes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary mb-1">
                                {equipmentList.length}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</div>
                        </div>
                    </div>
                </div>

                {/* Connection Info */}
                <div className={`mt-6 flex items-center justify-center gap-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Connecté au broker MQTT • Topic: site/pi5/generator/snapshot</span>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
