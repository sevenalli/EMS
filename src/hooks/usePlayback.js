import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/**
 * usePlayback Hook
 * Consolidated playback logic for history mode across Dashboard, Telemetry, Notifications, and Monitoring
 * 
 * @param {Array} historyData - Array of { timestamp, data } objects
 * @param {Object} options - Configuration options
 * @returns {Object} Playback state and controls
 */
export function usePlayback(historyData = [], options = {}) {
    const {
        autoPlay = false,
        defaultSpeed = 1,
        onIndexChange = null,
        intervalMs = 1000
    } = options

    // State
    const [isPlaying, setIsPlaying] = useState(autoPlay)
    const [playbackIndex, setPlaybackIndex] = useState(0)
    const [speed, setSpeed] = useState(defaultSpeed)

    // Refs
    const playbackRef = useRef(null)
    const indexRef = useRef(playbackIndex)

    // Keep ref in sync with state
    useEffect(() => {
        indexRef.current = playbackIndex
    }, [playbackIndex])

    // Calculate progress percentage
    const progress = useMemo(() => {
        if (!historyData || historyData.length <= 1) return 0
        return (playbackIndex / (historyData.length - 1)) * 100
    }, [playbackIndex, historyData])

    // Get current timestamp
    const currentTimestamp = useMemo(() => {
        if (!historyData || !historyData[playbackIndex]) return null
        return historyData[playbackIndex].timestamp
    }, [historyData, playbackIndex])

    // Get current data frame
    const currentData = useMemo(() => {
        if (!historyData || !historyData[playbackIndex]) return null
        return historyData[playbackIndex].data
    }, [historyData, playbackIndex])

    // Total frames
    const totalFrames = historyData?.length || 0

    // Clear interval helper
    const clearPlaybackInterval = useCallback(() => {
        if (playbackRef.current) {
            clearInterval(playbackRef.current)
            playbackRef.current = null
        }
    }, [])

    // Playback interval effect
    useEffect(() => {
        clearPlaybackInterval()

        if (!isPlaying || !historyData || historyData.length === 0) {
            return
        }

        playbackRef.current = setInterval(() => {
            setPlaybackIndex(prev => {
                const next = prev + 1
                if (next >= historyData.length) {
                    setIsPlaying(false)
                    return prev
                }
                onIndexChange?.(next)
                return next
            })
        }, intervalMs / speed)

        return clearPlaybackInterval
    }, [isPlaying, historyData, speed, intervalMs, clearPlaybackInterval, onIndexChange])

    // Reset when history data changes
    useEffect(() => {
        setPlaybackIndex(0)
        setIsPlaying(autoPlay && historyData?.length > 0)
    }, [historyData, autoPlay])

    // Controls
    const togglePlay = useCallback(() => {
        if (playbackIndex >= (historyData?.length || 1) - 1) {
            // Restart if at end
            setPlaybackIndex(0)
            setIsPlaying(true)
        } else {
            setIsPlaying(prev => !prev)
        }
    }, [playbackIndex, historyData])

    const play = useCallback(() => setIsPlaying(true), [])
    const pause = useCallback(() => setIsPlaying(false), [])

    const skipForward = useCallback((frames = 10) => {
        setPlaybackIndex(prev => {
            const maxIndex = (historyData?.length || 1) - 1
            const next = Math.min(prev + frames, maxIndex)
            onIndexChange?.(next)
            return next
        })
    }, [historyData, onIndexChange])

    const skipBackward = useCallback((frames = 10) => {
        setPlaybackIndex(prev => {
            const next = Math.max(prev - frames, 0)
            onIndexChange?.(next)
            return next
        })
    }, [onIndexChange])

    const goToIndex = useCallback((index) => {
        const maxIndex = (historyData?.length || 1) - 1
        const newIndex = Math.max(0, Math.min(index, maxIndex))
        setPlaybackIndex(newIndex)
        onIndexChange?.(newIndex)
    }, [historyData, onIndexChange])

    const goToProgress = useCallback((progressPercent) => {
        if (!historyData || historyData.length === 0) return
        const index = Math.round((progressPercent / 100) * (historyData.length - 1))
        goToIndex(index)
    }, [historyData, goToIndex])

    const reset = useCallback(() => {
        setPlaybackIndex(0)
        setIsPlaying(false)
        onIndexChange?.(0)
    }, [onIndexChange])

    const changeSpeed = useCallback((newSpeed) => {
        setSpeed(newSpeed)
    }, [])

    // Return playback state and controls
    return {
        // State
        isPlaying,
        playbackIndex,
        progress,
        speed,
        currentTimestamp,
        currentData,
        totalFrames,
        hasData: totalFrames > 0,
        isAtStart: playbackIndex === 0,
        isAtEnd: playbackIndex >= totalFrames - 1,

        // Controls
        togglePlay,
        play,
        pause,
        skipForward,
        skipBackward,
        goToIndex,
        goToProgress,
        reset,
        setSpeed: changeSpeed
    }
}

// Speed presets for UI
export const PLAYBACK_SPEEDS = [
    { label: '0.5x', value: 0.5 },
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '4x', value: 4 },
    { label: '8x', value: 8 }
]

export default usePlayback
