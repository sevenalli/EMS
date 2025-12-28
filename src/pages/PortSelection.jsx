import { useNavigate } from 'react-router-dom'
import { useStore, mockData } from '../store/store'
import { ChevronLeft, MapPin } from 'lucide-react'

// Port images - cycle through available images
const portImages = [
    '/port-1.png',
    '/port-2.png',
    '/port-3.jpg',
    '/port-4.jpg',
    '/port-5.png',
]

const PortSelection = () => {
    const navigate = useNavigate()
    const { setSelectedPort, isDarkMode } = useStore()

    const handlePortClick = (port) => {
        setSelectedPort(port)
        navigate('/equipment-selection')
    }

    return (
        <div className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${isDarkMode ? 'bg-[#1a365d]' : 'bg-gray-50'
            }`}>
            <div className="max-w-6xl mx-auto">
                {/* Back Button & Title */}
                <div className="mb-10">
                    <button
                        onClick={() => navigate('/')}
                        className={`flex items-center gap-2 mb-4 transition-colors group ${isDarkMode ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-primary'
                            }`}
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Retour à l'accueil
                    </button>

                    <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                        Sélection du <span className={isDarkMode ? 'text-blue-300' : 'text-primary'}>Port</span>
                    </h1>
                    <p className={isDarkMode ? 'text-white/70' : 'text-gray-500'}>
                        Choisissez un port pour accéder à ses équipements
                    </p>
                </div>

                {/* Ports Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {mockData.ports.map((port, index) => (
                        <button
                            key={port.id}
                            onClick={() => handlePortClick(port)}
                            className="group relative h-44 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                        >
                            {/* Background Image */}
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    backgroundImage: `url('${portImages[index % portImages.length]}')`
                                }}
                            />

                            {/* Overlay - Blue for dark mode, darker for light mode */}
                            <div className={`absolute inset-0 transition-colors duration-300 ${isDarkMode
                                    ? 'bg-[#1e3a5f]/70 group-hover:bg-[#1e3a5f]/60'
                                    : 'bg-black/50 group-hover:bg-black/40'
                                }`} />

                            {/* Content - Centered */}
                            <div className="relative h-full flex flex-col items-center justify-center">
                                {/* Location Pin */}
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <MapPin className="text-white" size={24} />
                                </div>

                                {/* Port Name */}
                                <h3 className="text-xl font-bold text-white">
                                    {port.name}
                                </h3>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default PortSelection
