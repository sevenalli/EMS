import { Link } from 'react-router-dom'
import { Sun, Moon, Map, Settings } from 'lucide-react'
import { useStore } from '../store/store'
import LanguageSwitcher from './common/LanguageSwitcher'

const Header = () => {
    const { isDarkMode, toggleDarkMode } = useStore()

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 h-16 border-b transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <img
                            src="/marsa-maroc-logo.png"
                            alt="Marsa Maroc"
                            className="h-10 w-auto"
                        />
                    </Link>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {/* Map Link */}
                        <Link
                            to="/map"
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            title="Map View"
                        >
                            <Map size={20} />
                        </Link>

                        {/* Fleet Admin Link */}
                        <Link
                            to="/admin"
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600'
                                }`}
                            title="Fleet Administration">
                            <Settings size={20} />
                        </Link>

                        {/* Language Switcher */}
                        <LanguageSwitcher compact />

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className={`px-4 py-2 rounded-full border transition-all duration-200 flex items-center gap-2 text-sm font-medium ${isDarkMode
                                ? 'border-gray-700 text-gray-300 hover:border-blue-500 hover:text-blue-400 bg-gray-800'
                                : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                                }`}
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                            {isDarkMode ? 'Light' : 'Dark'}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}

export default Header

