import { Play, Pause, SkipBack, SkipForward, Calendar } from 'lucide-react'
import { useStore } from '../../store/store'
import { PLAYBACK_SPEEDS } from '../../hooks/usePlayback'

/**
 * PlaybackBar Component
 * Reusable playback controls for history mode
 * Used in Dashboard, TelemetryDashboard, Notifications, EquipmentMonitoring
 */
function PlaybackBar({
    isPlaying,
    progress,
    playbackIndex,
    totalFrames,
    currentTimestamp,
    speed,
    onTogglePlay,
    onSkipForward,
    onSkipBackward,
    onSpeedChange,
    onProgressChange,
    compact = false,
    showTimestamp = true,
    showSpeed = true,
    className = ''
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)

    // Format timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '--:--:--'
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        })
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return ''
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }

    // Compact mode for small spaces
    if (compact) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <button
                    onClick={onSkipBackward}
                    className={`p-1.5 rounded hover:bg-white/10 ${isDarkMode ? 'text-white' : 'text-gray-600'}`}
                    aria-label="Skip backward"
                >
                    <SkipBack size={14} />
                </button>

                <button
                    onClick={onTogglePlay}
                    className={`p-1.5 rounded-full ${isDarkMode ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <button
                    onClick={onSkipForward}
                    className={`p-1.5 rounded hover:bg-white/10 ${isDarkMode ? 'text-white' : 'text-gray-600'}`}
                    aria-label="Skip forward"
                >
                    <SkipForward size={14} />
                </button>

                {/* Mini progress bar */}
                <div className={`w-20 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'}`}>
                    <div
                        className="h-full bg-blue-400 transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <span className={`text-xs tabular-nums ${isDarkMode ? 'text-white/70' : 'text-gray-500'}`}>
                    {playbackIndex + 1}/{totalFrames}
                </span>
            </div>
        )
    }

    // Full playback bar
    return (
        <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white shadow-sm'} ${className}`}>
            <div className="flex items-center gap-4">
                {/* Timestamp display */}
                {showTimestamp && (
                    <div className={`flex items-center gap-2 min-w-[140px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Calendar size={16} className="text-blue-500" />
                        <div className="text-sm font-mono">
                            <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                                {formatTime(currentTimestamp)}
                            </div>
                            <div className="text-xs">
                                {formatDate(currentTimestamp)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Playback controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onSkipBackward}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                            ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                        aria-label="Skip backward 10 frames"
                        title="Skip back"
                    >
                        <SkipBack size={18} />
                    </button>

                    <button
                        onClick={onTogglePlay}
                        className={`p-3 rounded-full transition-colors ${isDarkMode
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                            } shadow-lg`}
                        aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </button>

                    <button
                        onClick={onSkipForward}
                        className={`p-2 rounded-lg transition-colors ${isDarkMode
                            ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                            : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                        aria-label="Skip forward 10 frames"
                        title="Skip forward"
                    >
                        <SkipForward size={18} />
                    </button>
                </div>

                {/* Progress slider */}
                <div className="flex-1 px-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => onProgressChange?.(parseFloat(e.target.value))}
                        className={`w-full h-2 rounded-full appearance-none cursor-pointer ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                            } [&::-webkit-slider-thumb]:appearance-none 
                            [&::-webkit-slider-thumb]:w-4 
                            [&::-webkit-slider-thumb]:h-4 
                            [&::-webkit-slider-thumb]:rounded-full 
                            [&::-webkit-slider-thumb]:bg-blue-500 
                            [&::-webkit-slider-thumb]:shadow-lg
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:hover:bg-blue-400`}
                        style={{
                            background: `linear-gradient(to right, #3b82f6 ${progress}%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e5e7eb'} ${progress}%)`
                        }}
                        aria-label="Playback progress"
                    />
                </div>

                {/* Frame counter */}
                <div className={`text-sm font-mono min-w-[80px] text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>{playbackIndex + 1}</span>
                    <span> / {totalFrames}</span>
                </div>

                {/* Speed selector */}
                {showSpeed && (
                    <select
                        value={speed}
                        onChange={(e) => onSpeedChange?.(parseFloat(e.target.value))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${isDarkMode
                            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                            : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
                            } cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        aria-label="Playback speed"
                    >
                        {PLAYBACK_SPEEDS.map((s) => (
                            <option key={s.value} value={s.value} className={isDarkMode ? 'bg-gray-800' : ''}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    )
}

export default PlaybackBar
