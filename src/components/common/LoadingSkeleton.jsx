import { useStore } from '../../store/store'

/**
 * Loading Skeleton Components
 * Animated placeholders shown while content is loading
 */

// Base skeleton with shimmer animation
const SkeletonBase = ({ className = '', children }) => {
    const isDarkMode = useStore((state) => state.isDarkMode)

    return (
        <div
            className={`animate-pulse ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded ${className}`}
        >
            {children}
        </div>
    )
}

// Skeleton for equipment cards
export const SkeletonCard = () => {
    const isDarkMode = useStore((state) => state.isDarkMode)

    return (
        <div className={`rounded-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                    <SkeletonBase className="w-3 h-3 rounded-full" />
                    <SkeletonBase className="w-24 h-5" />
                </div>
                <div className="flex items-center gap-2">
                    <SkeletonBase className="w-16 h-4" />
                    <SkeletonBase className="w-4 h-4" />
                </div>
            </div>

            {/* Image section */}
            <div className={`p-4 flex items-center gap-4 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                <SkeletonBase className="w-20 h-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <SkeletonBase className="w-20 h-4" />
                    <SkeletonBase className="w-32 h-3" />
                </div>
                <SkeletonBase className="w-12 h-12 rounded-lg" />
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-px">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <SkeletonBase className="w-4 h-4" />
                            <SkeletonBase className="w-16 h-3" />
                        </div>
                        <SkeletonBase className="w-12 h-6" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Skeleton for telemetry widgets
export const SkeletonWidget = ({ size = 'md' }) => {
    const isDarkMode = useStore((state) => state.isDarkMode)
    const sizeClasses = {
        sm: 'w-24 h-24',
        md: 'w-32 h-32',
        lg: 'w-40 h-40'
    }

    return (
        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
            <SkeletonBase className="w-20 h-3 mb-3" />
            <SkeletonBase className={`${sizeClasses[size]} rounded-full mx-auto mb-3`} />
            <div className="text-center space-y-1">
                <SkeletonBase className="w-16 h-6 mx-auto" />
                <SkeletonBase className="w-10 h-3 mx-auto" />
            </div>
        </div>
    )
}

// Skeleton for table rows
export const SkeletonTableRow = ({ columns = 4 }) => {
    return (
        <tr>
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <SkeletonBase className="w-full h-4" />
                </td>
            ))}
        </tr>
    )
}

// Skeleton for notification items
export const SkeletonNotification = () => {
    const isDarkMode = useStore((state) => state.isDarkMode)

    return (
        <div className={`flex items-start gap-4 p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
            <SkeletonBase className="w-10 h-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <SkeletonBase className="w-16 h-4" />
                    <SkeletonBase className="w-20 h-3" />
                </div>
                <SkeletonBase className="w-full h-4" />
                <SkeletonBase className="w-32 h-3" />
            </div>
            <SkeletonBase className="w-3 h-3 rounded-full" />
        </div>
    )
}

// Skeleton for playback bar
export const SkeletonPlayback = () => {
    const isDarkMode = useStore((state) => state.isDarkMode)

    return (
        <div className={`flex items-center gap-4 p-3 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
            <SkeletonBase className="w-8 h-8 rounded-full" />
            <SkeletonBase className="w-8 h-8 rounded-full" />
            <SkeletonBase className="w-8 h-8 rounded-full" />
            <SkeletonBase className="flex-1 h-2 rounded-full" />
            <SkeletonBase className="w-20 h-4" />
        </div>
    )
}

export default {
    SkeletonCard,
    SkeletonWidget,
    SkeletonTableRow,
    SkeletonNotification,
    SkeletonPlayback
}
