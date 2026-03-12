import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
    Leaf
} from 'lucide-react'

// Components
import ServiceCard from '../components/dashboard/ServiceCard'
import LiveClock from '../components/dashboard/LiveClock'

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
    const { t } = useTranslation()
    const { setSelectedService, isDarkMode } = useStore()

    const handleServiceClick = (service) => {
        setSelectedService(service)
        if (service.id === 'monitoring') {
            navigate('/ports')
        }
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero Section */}
                <div className={`rounded-3xl p-8 mb-12 relative overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 shadow-xl' : 'bg-white shadow-sm'
                    }`}>
                    <div className="relative z-10">
                        <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                            {t('home.title').split(' ').map((word, i) =>
                                word === 'BUM' ? <span key={i} className="text-blue-500"> {word}</span> : <span key={i}>{i > 0 ? ' ' : ''}{word}</span>
                            )}
                        </h1>
                        <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('home.subtitle')}
                        </p>

                        {/* Date Badge */}
                        <LiveClock isDarkMode={isDarkMode} />

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleServiceClick({ id: '3d-realtime' })}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25"
                            >
                                <Box size={18} />
                                {t('home.start3d')}
                            </button>
                            <button
                                onClick={() => handleServiceClick({ id: 'monitoring' })}
                                className={`border-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${isDarkMode
                                    ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-500 hover:text-blue-500'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-500'
                                    }`}
                            >
                                <Monitor size={18} />
                                {t('home.monitoring')}
                            </button>
                        </div>
                    </div>

                    {/* Marsa Maroc Logo */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:block">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl p-2 ${isDarkMode ? 'bg-white/10 backdrop-blur-md' : 'bg-white'
                            }`}>
                            <img
                                src="/marsa-maroc-logo.png"
                                alt="Marsa Maroc"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="text-center mb-8">
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        {t('home.features').split(' ').map((word, i) =>
                            word.toLowerCase() === 'principales' || word.toLowerCase() === 'core' ?
                                <span key={i} className="text-blue-500"> {word}</span> : <span key={i}>{i > 0 ? ' ' : ''}{word}</span>
                        )}
                    </h2>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockData.services.slice(0, 6).map((service) => {
                        const Icon = iconMap[service.icon] || Box
                        return (
                            <ServiceCard
                                key={service.id}
                                name={service.name}
                                icon={Icon}
                                isMonitoring={service.id === 'monitoring'}
                                isDarkMode={isDarkMode}
                                onClick={() => handleServiceClick(service)}
                            />
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
                                <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-all duration-300 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                    }`}>
                                    <Icon className={`group-hover:text-white transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                        }`} size={24} />
                                </div>

                                {/* Label */}
                                <h3 className={`font-medium text-sm group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    {service.name}
                                </h3>
                                <span className={`text-xs mt-1 block ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {t('home.comingSoon')}
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
