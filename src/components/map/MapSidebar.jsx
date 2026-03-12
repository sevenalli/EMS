import { useState, useMemo } from 'react'
import {
    Search,
    X,
    ChevronRight,
    Activity,
    Wifi,
    WifiOff,
    AlertTriangle,
    Wrench,
    Filter,
    Anchor as Crane, // data-model uses 'Crane' so we alias it
    Box as Container, // data-model uses 'Container' so we alias it
    Truck,
    Package
} from 'lucide-react'

const STATUS_CONFIG = {
    active: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Active' },
    affected: { color: 'text-blue-500', bg: 'bg-blue-500', label: 'Affected' },
    standby: { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Standby' },
    off: { color: 'text-slate-500', bg: 'bg-slate-500', label: 'Off' },
    maintenance: { color: 'text-red-500', bg: 'bg-red-500', label: 'Maintenance' }
}

const CATEGORY_ICONS = {
    'grue-mobile': Crane,
    'portique': Container,
    'chariot': Truck,
    'reachstacker': Package
}

export default function MapSidebar({
    equipment,
    categories,
    selectedEquipment,
    onSelectEquipment,
    onClose,
    isOpen,
    isDarkMode
}) {
    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState('all')

    // Filter equipment
    const filteredEquipment = useMemo(() => {
        return equipment.filter(eq => {
            const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                eq.id.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = activeCategory === 'all' || eq.categoryId === activeCategory
            return matchesSearch && matchesCategory
        })
    }, [equipment, searchQuery, activeCategory])

    // Stats
    const stats = useMemo(() => ({
        total: equipment.length,
        active: equipment.filter(e => e.status === 'active').length,
        alerts: equipment.reduce((sum, e) => sum + (e.notifications || 0), 0),
        maintenance: equipment.filter(e => e.status === 'maintenance').length
    }), [equipment])

    return (
        <div className={`
            fixed top-0 left-0 h-full z-[1000] transition-all duration-300 ease-out
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            w-full sm:w-96
        `}>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm sm:hidden -z-10"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <div className={`
                h-full flex flex-col overflow-hidden
                ${isDarkMode
                    ? 'bg-gray-900/95 backdrop-blur-xl border-r border-white/10'
                    : 'bg-white/95 backdrop-blur-xl border-r border-gray-200 shadow-2xl'
                }
            `}>
                {/* Header */}
                <div className={`
                    p-4 border-b flex-shrink-0
                    ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50/50'}
                `}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Equipment
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                ? 'hover:bg-white/10 text-gray-400'
                                : 'hover:bg-gray-100 text-gray-500'
                                }`}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {[
                            { label: 'Total', value: stats.total, color: 'text-blue-500' },
                            { label: 'Active', value: stats.active, color: 'text-emerald-500' },
                            { label: 'Alerts', value: stats.alerts, color: 'text-red-500' },
                            { label: 'Maint.', value: stats.maintenance, color: 'text-amber-500' }
                        ].map(stat => (
                            <div
                                key={stat.label}
                                className={`text-center p-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'
                                    }`}
                            >
                                <div className={`text-lg font-bold ${stat.color}`}>
                                    {stat.value}
                                </div>
                                <div className={`text-[10px] uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                    }`}>
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} size={18} />
                        <input
                            type="text"
                            placeholder="Search equipment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all ${isDarkMode
                                ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:bg-white/10'
                                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:shadow-lg'
                                } outline-none`}
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className={`
                    flex gap-1 p-2 overflow-x-auto flex-shrink-0 scrollbar-hide
                    ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}
                `}>
                    <button
                        onClick={() => setActiveCategory('all')}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === 'all'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : isDarkMode
                                ? 'text-gray-400 hover:bg-white/10'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => {
                        const Icon = CATEGORY_ICONS[cat.id] || Filter
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === cat.id
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                    : isDarkMode
                                        ? 'text-gray-400 hover:bg-white/10'
                                        : 'text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Icon size={14} />
                                <span className="hidden sm:inline">{cat.name}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Equipment List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredEquipment.length === 0 ? (
                        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Search size={40} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No equipment found</p>
                        </div>
                    ) : (
                        filteredEquipment.map(eq => {
                            const statusConfig = STATUS_CONFIG[eq.status] || STATUS_CONFIG.off
                            const isSelected = selectedEquipment === eq.id

                            return (
                                <button
                                    key={eq.id}
                                    onClick={() => onSelectEquipment(eq.id)}
                                    className={`
                                        w-full p-3 rounded-xl text-left transition-all duration-200
                                        ${isSelected
                                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                                            : isDarkMode
                                                ? 'bg-white/5 hover:bg-white/10 text-white'
                                                : 'bg-white hover:bg-gray-50 text-gray-900 shadow-sm hover:shadow-md'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Status Indicator */}
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                            ${isSelected ? 'bg-white/20' : statusConfig.bg + '/20'}
                                        `}>
                                            <div className={`
                                                w-3 h-3 rounded-full
                                                ${isSelected ? 'bg-white' : statusConfig.bg}
                                                ${eq.status === 'active' ? 'animate-pulse' : ''}
                                            `} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-sm truncate">
                                                    {eq.id}
                                                </span>
                                                {eq.notifications > 0 && (
                                                    <span className={`
                                                        flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold
                                                        ${isSelected
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-red-500/20 text-red-500'
                                                        }
                                                    `}>
                                                        {eq.notifications}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={`text-xs truncate ${isSelected ? 'text-white/70' : isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                                }`}>
                                                {eq.name}
                                            </div>
                                        </div>

                                        <ChevronRight size={16} className={`flex-shrink-0 ${isSelected ? 'text-white/70' : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                                            }`} />
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
