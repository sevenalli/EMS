import { useState } from 'react'
import { ChevronUp, ChevronDown, Eye, EyeOff, RotateCcw, Settings } from 'lucide-react'
import { useStore } from '../../store/store'
import { useDashboardConfig } from '../../hooks/useDashboardConfig'
import { TELEMETRY_CATEGORIES } from '../../data/telemetryData'

/**
 * Dashboard Layout Customizer
 * Allows users to reorder and hide/show widget categories
 */
function DashboardCustomizer({ isOpen, onClose }) {
    const isDarkMode = useStore((state) => state.isDarkMode)
    const {
        categoryOrder,
        hiddenCategories,
        moveCategoryUp,
        moveCategoryDown,
        toggleCategory,
        showAllCategories,
        resetLayout
    } = useDashboardConfig()

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed right-0 top-0 bottom-0 w-80 z-50 overflow-y-auto ${isDarkMode ? 'bg-gray-900 border-l border-gray-800' : 'bg-white shadow-2xl'
                }`}>
                {/* Header */}
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Settings size={20} className="text-blue-500" />
                            <h2 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                Customize Layout
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-1 rounded ${isDarkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={showAllCategories}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 ${isDarkMode
                                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                        >
                            <Eye size={14} />
                            Show All
                        </button>
                        <button
                            onClick={resetLayout}
                            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1 ${isDarkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <RotateCcw size={14} />
                            Reset
                        </button>
                    </div>
                </div>

                {/* Category list */}
                <div className="p-4 space-y-2">
                    {categoryOrder.map((categoryId, index) => {
                        const category = TELEMETRY_CATEGORIES[categoryId]
                        if (!category) return null

                        const isHidden = hiddenCategories.includes(categoryId)
                        const isFirst = index === 0
                        const isLast = index === categoryOrder.length - 1

                        return (
                            <div
                                key={categoryId}
                                className={`flex items-center gap-2 p-3 rounded-lg ${isHidden
                                        ? isDarkMode ? 'bg-gray-800/50 opacity-50' : 'bg-gray-50 opacity-50'
                                        : isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                                    }`}
                            >
                                {/* Category info */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${isHidden
                                            ? 'text-gray-500'
                                            : isDarkMode ? 'text-white' : 'text-gray-800'
                                        }`}>
                                        {category.title}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {category.widgets?.length || 0} widgets
                                    </p>
                                </div>

                                {/* Visibility toggle */}
                                <button
                                    onClick={() => toggleCategory(categoryId)}
                                    className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                        }`}
                                    title={isHidden ? 'Show' : 'Hide'}
                                >
                                    {isHidden
                                        ? <EyeOff size={16} className="text-gray-400" />
                                        : <Eye size={16} className="text-green-500" />
                                    }
                                </button>

                                {/* Reorder buttons */}
                                <div className="flex flex-col gap-0.5">
                                    <button
                                        onClick={() => moveCategoryUp(categoryId)}
                                        disabled={isFirst}
                                        className={`p-0.5 rounded ${isFirst
                                                ? 'opacity-30 cursor-not-allowed'
                                                : isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                            }`}
                                        title="Move up"
                                    >
                                        <ChevronUp size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                    </button>
                                    <button
                                        onClick={() => moveCategoryDown(categoryId)}
                                        disabled={isLast}
                                        className={`p-0.5 rounded ${isLast
                                                ? 'opacity-30 cursor-not-allowed'
                                                : isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                                            }`}
                                        title="Move down"
                                    >
                                        <ChevronDown size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Drag categories to reorder. Changes are saved automatically.
                    </p>
                </div>
            </div>
        </>
    )
}

export default DashboardCustomizer
