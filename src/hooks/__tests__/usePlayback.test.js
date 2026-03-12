import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePlayback, PLAYBACK_SPEEDS } from '../usePlayback'

describe('usePlayback', () => {
    const mockHistoryData = [
        { timestamp: new Date('2024-01-01T10:00:00'), data: { value: 1 } },
        { timestamp: new Date('2024-01-01T10:00:01'), data: { value: 2 } },
        { timestamp: new Date('2024-01-01T10:00:02'), data: { value: 3 } },
        { timestamp: new Date('2024-01-01T10:00:03'), data: { value: 4 } },
        { timestamp: new Date('2024-01-01T10:00:04'), data: { value: 5 } }
    ]

    beforeEach(() => {
        vi.useFakeTimers()
    })

    it('should initialize with correct default values', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        expect(result.current.isPlaying).toBe(false)
        expect(result.current.playbackIndex).toBe(0)
        expect(result.current.progress).toBe(0)
        expect(result.current.speed).toBe(1)
        expect(result.current.totalFrames).toBe(5)
        expect(result.current.isAtStart).toBe(true)
        expect(result.current.isAtEnd).toBe(false)
    })

    it('should handle empty history data', () => {
        const { result } = renderHook(() => usePlayback([]))

        expect(result.current.hasData).toBe(false)
        expect(result.current.totalFrames).toBe(0)
        expect(result.current.currentData).toBeNull()
    })

    it('should toggle play/pause', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        expect(result.current.isPlaying).toBe(false)

        act(() => {
            result.current.togglePlay()
        })

        expect(result.current.isPlaying).toBe(true)

        act(() => {
            result.current.togglePlay()
        })

        expect(result.current.isPlaying).toBe(false)
    })

    it('should skip forward', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        expect(result.current.playbackIndex).toBe(0)

        act(() => {
            result.current.skipForward(2)
        })

        expect(result.current.playbackIndex).toBe(2)
    })

    it('should not skip beyond last frame', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.skipForward(100)
        })

        expect(result.current.playbackIndex).toBe(4) // Last index
        expect(result.current.isAtEnd).toBe(true)
    })

    it('should skip backward', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.goToIndex(3)
        })

        act(() => {
            result.current.skipBackward(2)
        })

        expect(result.current.playbackIndex).toBe(1)
    })

    it('should not skip before first frame', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.skipBackward(100)
        })

        expect(result.current.playbackIndex).toBe(0)
        expect(result.current.isAtStart).toBe(true)
    })

    it('should go to specific index', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.goToIndex(3)
        })

        expect(result.current.playbackIndex).toBe(3)
        expect(result.current.currentData).toEqual({ value: 4 })
    })

    it('should go to progress percentage', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.goToProgress(50)
        })

        expect(result.current.playbackIndex).toBe(2) // 50% of 5 frames = index 2
    })

    it('should change speed', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.setSpeed(4)
        })

        expect(result.current.speed).toBe(4)
    })

    it('should reset playback', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.goToIndex(3)
            result.current.play()
        })

        act(() => {
            result.current.reset()
        })

        expect(result.current.playbackIndex).toBe(0)
        expect(result.current.isPlaying).toBe(false)
    })

    it('should calculate progress correctly', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.goToIndex(2)
        })

        expect(result.current.progress).toBe(50) // 2/4 * 100 = 50%
    })

    it('should return current timestamp', () => {
        const { result } = renderHook(() => usePlayback(mockHistoryData))

        act(() => {
            result.current.goToIndex(1)
        })

        expect(result.current.currentTimestamp).toEqual(mockHistoryData[1].timestamp)
    })

    it('should auto-play when option is set', () => {
        const { result } = renderHook(() =>
            usePlayback(mockHistoryData, { autoPlay: true })
        )

        expect(result.current.isPlaying).toBe(true)
    })

    it('should use default speed from options', () => {
        const { result } = renderHook(() =>
            usePlayback(mockHistoryData, { defaultSpeed: 2 })
        )

        expect(result.current.speed).toBe(2)
    })

    it('should call onIndexChange callback', () => {
        const onIndexChange = vi.fn()
        const { result } = renderHook(() =>
            usePlayback(mockHistoryData, { onIndexChange })
        )

        act(() => {
            result.current.goToIndex(2)
        })

        expect(onIndexChange).toHaveBeenCalledWith(2)
    })
})

describe('PLAYBACK_SPEEDS', () => {
    it('should have correct speed presets', () => {
        expect(PLAYBACK_SPEEDS).toHaveLength(5)
        expect(PLAYBACK_SPEEDS[0]).toEqual({ label: '0.5x', value: 0.5 })
        expect(PLAYBACK_SPEEDS[1]).toEqual({ label: '1x', value: 1 })
        expect(PLAYBACK_SPEEDS[4]).toEqual({ label: '8x', value: 8 })
    })
})
