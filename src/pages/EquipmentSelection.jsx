import { useNavigate } from 'react-router-dom'
import { useStore, mockData } from '../store/store'
import {
    ChevronLeft,
    Check,
    Anchor,
    Container,
    Truck,
    Package,
    Building2,
    Layers,
    Cog,
    ArrowRight,
    Info
} from 'lucide-react'

const categoryIcons = {
    Crane: Anchor,
    Container,
    Truck,
    Package,
}

const EquipmentSelection = () => {
    const navigate = useNavigate()
    const {
        selectedPort,
        selectedTerminal,
        selectedCategory,
        selectedEquipment,
        setSelectedTerminal,
        setSelectedCategory,
        toggleEquipment,
        isDarkMode
    } = useStore()

    const terminals = mockData.terminals

    const filteredEquipment = mockData.equipment.filter(eq => {
        if (selectedTerminal && eq.terminalId !== selectedTerminal.id) return false
        if (selectedCategory && eq.categoryId !== selectedCategory.id) return false
        return true
    })

    const handleProceed = () => {
        if (selectedEquipment.length > 0) {
            navigate('/dashboard')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-500'
            case 'alarm': return 'bg-red-500'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/ports')}
                        className={`flex items-center gap-2 mb-4 transition-colors group ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-primary'
                            }`}
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Retour aux ports
                    </button>

                    <div className="flex items-center gap-3 mb-2">
                        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Sélection des <span className="text-primary">Équipements</span>
                        </h1>
                        {selectedPort && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-primary'
                                }`}>
                                {selectedPort.name}
                            </span>
                        )}
                    </div>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Sélectionnez le terminal, la catégorie, puis les équipements à superviser
                    </p>
                </div>

                {/* Three Column Selection */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Terminal Selection */}
                    <div className={`rounded-2xl p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'
                                }`}>
                                <Building2 className="text-primary" size={20} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Terminal</h3>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Étape 1</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {terminals.map((terminal) => (
                                <button
                                    key={terminal.id}
                                    onClick={() => setSelectedTerminal(terminal)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${selectedTerminal?.id === terminal.id
                                            ? 'bg-primary text-white shadow-md'
                                            : isDarkMode
                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <span className="font-medium">{terminal.name}</span>
                                    {selectedTerminal?.id === terminal.id && (
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Selection */}
                    <div className={`rounded-2xl p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-amber-900/50' : 'bg-amber-50'
                                }`}>
                                <Layers className="text-amber-500" size={20} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Catégorie</h3>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Étape 2</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {mockData.categories.map((category) => {
                                const Icon = categoryIcons[category.icon] || Cog
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${selectedCategory?.id === category.id
                                                ? 'bg-primary text-white shadow-md'
                                                : isDarkMode
                                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} />
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                        {selectedCategory?.id === category.id && (
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                <Check size={14} />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Equipment Selection */}
                    <div className={`rounded-2xl p-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-green-900/50' : 'bg-green-50'
                                }`}>
                                <Cog className="text-green-500" size={20} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Équipement</h3>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Étape 3</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {filteredEquipment.length > 0 ? (
                                filteredEquipment.map((equipment) => {
                                    const isSelected = selectedEquipment.includes(equipment.id)
                                    return (
                                        <button
                                            key={equipment.id}
                                            onClick={() => toggleEquipment(equipment.id)}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${isSelected
                                                    ? 'bg-primary text-white shadow-md'
                                                    : isDarkMode
                                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(equipment.status)}`} />
                                                <span className="font-medium">{equipment.id}</span>
                                            </div>
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                    <Check size={14} />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })
                            ) : (
                                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <Cog size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Filtrez par terminal et catégorie</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Panel */}
                <div className={`rounded-2xl p-6 mb-6 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
                    }`}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'
                            }`}>
                            <Info className="text-primary" size={20} />
                        </div>
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Information sur l'équipement sélectionné
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Port</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedPort?.name || '—'}</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Terminal</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedTerminal?.name || '—'}</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Catégorie</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{selectedCategory?.name || '—'}</p>
                        </div>
                        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Équipements</p>
                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {selectedEquipment.length > 0
                                    ? `${selectedEquipment.length} sélectionné(s)`
                                    : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                    <button
                        onClick={handleProceed}
                        disabled={selectedEquipment.length === 0}
                        className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${selectedEquipment.length > 0
                                ? 'bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/30 cursor-pointer'
                                : isDarkMode
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Procéder à la visualisation
                        <ArrowRight size={22} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EquipmentSelection
