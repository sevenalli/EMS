import { useNavigate } from 'react-router-dom'
import { useStore, mockData } from '../store/store'
import {
    Box,
    PlayCircle,
    Monitor,
    Wrench,
    BarChart3,
    TrendingUp,
    Shield,
    Stethoscope,
    Leaf,
    Calendar,
    Settings
} from 'lucide-react'

const iconMap = {
    Box,
    PlayCircle,
    Activity: Monitor,
    Wrench,
    BarChart3,
    TrendingUp,
    Shield,
    Stethoscope,
    Leaf,
}

const Home = () => {
    const navigate = useNavigate()
    const { setSelectedService, isDarkMode } = useStore()

    const handleServiceClick = (service) => {
        setSelectedService(service)
        if (service.id === 'monitoring') {
            navigate('/ports')
        }
    }

    const currentDate = new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className={`rounded-3xl p-8 mb-12 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-sm'
                    }`}>
                    <div className="relative z-10">
                        <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            Tableau de bord <span className="text-primary">BUM</span>
                        </h1>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Plateforme de gestion intelligente des opérations portuaires
                        </p>

                        {/* Date Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6 ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-50 text-primary'
                            }`}>
                            <Calendar size={16} />
                            <span>{currentDate}</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleServiceClick({ id: '3d-realtime' })}
                                className="bg-primary hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
                            >
                                <Box size={18} />
                                Démarrer 3D Temps réel
                            </button>
                            <button
                                onClick={() => handleServiceClick({ id: 'monitoring' })}
                                className={`border-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-primary hover:text-primary'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-primary hover:text-primary'
                                    }`}
                            >
                                <Monitor size={18} />
                                Monitoring des engins
                            </button>
                        </div>
                    </div>

                    {/* Decorative Icon */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block">
                        <div className="w-28 h-28 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                            <Settings size={48} className="text-white" />
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="text-center mb-8">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Fonctionnalités <span className="text-primary">principales</span>
                    </h2>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockData.services.slice(0, 6).map((service) => {
                        const Icon = iconMap[service.icon] || Box
                        const isMonitoring = service.id === 'monitoring'

                        return (
                            <button
                                key={service.id}
                                onClick={() => handleServiceClick(service)}
                                className={`group rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isMonitoring ? 'ring-2 ring-primary ring-offset-2' : ''
                                    } ${isDarkMode
                                        ? `bg-gray-800 ${isMonitoring ? 'ring-offset-gray-900' : ''} shadow-lg`
                                        : 'bg-white shadow-sm'
                                    }`}
                            >
                                {/* Icon */}
                                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-50'
                                    }`}>
                                    <Icon className="text-primary group-hover:text-white transition-colors" size={28} />
                                </div>

                                {/* Label */}
                                <h3 className={`font-medium group-hover:text-primary transition-colors ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                    {service.name}
                                </h3>
                            </button>
                        )
                    })}
                </div>

                {/* Secondary Features Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                    {mockData.services.slice(6).map((service) => {
                        const Icon = iconMap[service.icon] || Box

                        return (
                            <button
                                key={service.id}
                                onClick={() => handleServiceClick(service)}
                                className={`group rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 opacity-60 hover:opacity-100 ${isDarkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-sm'
                                    }`}
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:bg-primary transition-all duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                    <Icon className={`group-hover:text-white transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`} size={24} />
                                </div>

                                {/* Label */}
                                <h3 className={`font-medium text-sm group-hover:text-primary transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    {service.name}
                                </h3>
                                <span className={`text-xs mt-1 block ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Bientôt disponible
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default Home
