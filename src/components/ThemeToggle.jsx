import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useStore } from '../store/store'

const ThemeToggle = () => {
    const isDarkMode = useStore((state) => state.isDarkMode)
    const toggleDarkMode = useStore((state) => state.toggleDarkMode)

    return (
        <button
            onClick={toggleDarkMode}
            className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isDarkMode
                    ? 'bg-[#1a2035] text-yellow-400 border border-indigo-500/30 hover:bg-[#2a3555]'
                    : 'bg-white text-orange-500 border border-gray-200 hover:bg-gray-50'
                }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
        >
            {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
    )
}

export default ThemeToggle
