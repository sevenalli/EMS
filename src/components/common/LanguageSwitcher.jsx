import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, ChevronDown } from 'lucide-react'
import { useStore } from '../../store/store'
import { changeLanguage, languages } from '../../i18n'

/**
 * Language Switcher Component
 * Dropdown to change application language
 */
function LanguageSwitcher({ compact = false, className = '' }) {
    const { i18n } = useTranslation()
    const isDarkMode = useStore((state) => state.isDarkMode)
    const [isOpen, setIsOpen] = useState(false)

    const currentLang = languages.find(l => l.code === i18n.language) || languages[0]

    const handleChange = (langCode) => {
        changeLanguage(langCode)
        setIsOpen(false)
    }

    if (compact) {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-2 rounded-lg transition-colors ${isDarkMode
                            ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                    aria-label="Change language"
                    title={currentLang.name}
                >
                    <span className="text-lg">{currentLang.flag}</span>
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className={`absolute right-0 top-full mt-1 z-50 rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}>
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleChange(lang.code)}
                                    className={`w-full px-4 py-2 flex items-center gap-2 text-sm transition-colors ${lang.code === i18n.language
                                            ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                                            : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <span>{lang.flag}</span>
                                    <span>{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        )
    }

    // Full dropdown version
    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isDarkMode
                        ? 'bg-white/10 hover:bg-white/20 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                aria-label="Change language"
            >
                <Languages size={16} />
                <span className="text-sm font-medium">{currentLang.name}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className={`absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleChange(lang.code)}
                                className={`w-full px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${lang.code === i18n.language
                                        ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                                        : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span className="font-medium">{lang.name}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default LanguageSwitcher
