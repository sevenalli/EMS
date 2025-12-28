import { useState, useCallback } from 'react'
import { TAG_MAPPINGS } from '../data/telemetryData'

/**
 * History Service Hook
 * Fetches historical telemetry data from API
 * Same pattern as Angular's HistoryService in supension.component.ts
 */

// API Base URL - use relative path to leverage Vite proxy
const API_BASE_URL = '/api'

// All tag names for history queries - dynamically from TAG_MAPPINGS
export const HISTORY_TAG_NAMES = Object.values(TAG_MAPPINGS)

/**
 * Parse raw API value to telemetry object key
 */
const tagNameToKey = (tagName) => {
    console.log('[tagNameToKey] Looking up key for:', tagName)
    // Reverse lookup from TAG_MAPPINGS
    for (const [key, value] of Object.entries(TAG_MAPPINGS)) {
        if (value === tagName) {
            console.log('[tagNameToKey] Found key:', key)
            return key
        }
    }
    console.log('[tagNameToKey] No key found for:', tagName)
    return null
}

/**
 * Group history data points by tag name
 * Backend uses 'name' field, not 'tagName'
 */
export const groupByTagName = (dataPoints) => {
    console.log('[groupByTagName] Grouping', dataPoints.length, 'data points')
    const grouped = new Map()
    dataPoints.forEach(point => {
        const tagName = point.name || point.tagName // Backend uses 'name'
        if (!grouped.has(tagName)) {
            grouped.set(tagName, [])
        }
        grouped.get(tagName).push({ ...point, tagName })
    })
    console.log('[groupByTagName] Created', grouped.size, 'tag groups')
    console.log('[groupByTagName] Tag names:', Array.from(grouped.keys()).slice(0, 10), '...')
    return grouped
}

/**
 * Custom hook for fetching and managing historical telemetry data
 */
export const useHistory = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [playbackData, setPlaybackData] = useState(new Map())
    const [playbackTimestamps, setPlaybackTimestamps] = useState([])

    /**
     * Fetch historical data from API
     * Same as Angular's historyService.getTagHistory()
     * @param {object} timeRange - Time range config with unit and value
     * @param {string[]} customTags - Optional list of specific tags to fetch
     */
    const fetchHistoricalData = useCallback(async (timeRange, customTags = null) => {
        const tagNames = customTags || HISTORY_TAG_NAMES
        console.log('[fetchHistoricalData] Starting fetch for time range:', timeRange)
        console.log('[fetchHistoricalData] Using', tagNames.length, 'tags:', customTags ? 'CUSTOM' : 'DEFAULT')
        setIsLoading(true)
        setError('')

        const endTime = new Date()
        let startTime = new Date()

        // Calculate start time based on range
        if (timeRange.unit === 'hours') {
            startTime.setHours(startTime.getHours() - timeRange.value)
        } else if (timeRange.unit === 'days') {
            startTime.setDate(startTime.getDate() - timeRange.value)
        }

        console.log('[fetchHistoricalData] Time range:', startTime.toISOString(), 'to', endTime.toISOString())

        try {
            console.log('[fetchHistoricalData] Making API request to:', `${API_BASE_URL}/history/tags`)

            const requestBody = {
                tagNames: tagNames,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                limit: 10000
            }
            console.log('[fetchHistoricalData] Request body:', JSON.stringify(requestBody, null, 2))

            // Real API call - POST /api/history/tags
            const response = await fetch(`${API_BASE_URL}/history/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            console.log('[fetchHistoricalData] Response status:', response.status)
            console.log('[fetchHistoricalData] Response headers:', Object.fromEntries(response.headers.entries()))

            if (!response.ok) {
                const errorText = await response.text()
                console.error('[fetchHistoricalData] API error response:', errorText)
                throw new Error(`API error: ${response.status}`)
            }

            const result = await response.json()
            console.log('[fetchHistoricalData] API response:', {
                count: result.count,
                tagCount: result.tagCount,
                timeRange: result.timeRange,
                rangeMinutes: result.rangeMinutes,
                downsampled: result.downsampled,
                queryTimeMs: result.queryTimeMs,
                dataLength: result.data?.length
            })

            if (!result.data || result.data.length === 0) {
                console.warn('[fetchHistoricalData] No data returned from API')
                setError('No data found for the selected time range')
                setIsLoading(false)
                return null
            }

            console.log('[fetchHistoricalData] Sample data point:', result.data[0])

            // Group data by tag name
            console.log('[fetchHistoricalData] Grouping data by tag name...')
            const grouped = groupByTagName(result.data)
            setPlaybackData(grouped)

            // Extract unique timestamps and sort them
            console.log('[fetchHistoricalData] Extracting unique timestamps...')
            const allTimestamps = new Set()
            grouped.forEach(points => {
                points.forEach(p => allTimestamps.add(p.ts))
            })
            const sortedTimestamps = Array.from(allTimestamps)
                .map(ts => new Date(ts))
                .sort((a, b) => a.getTime() - b.getTime())

            console.log('[fetchHistoricalData] Found', sortedTimestamps.length, 'unique timestamps')
            console.log('[fetchHistoricalData] First timestamp:', sortedTimestamps[0])
            console.log('[fetchHistoricalData] Last timestamp:', sortedTimestamps[sortedTimestamps.length - 1])

            setPlaybackTimestamps(sortedTimestamps)

            // Convert grouped data to history array format for playback
            console.log('[fetchHistoricalData] Converting to history array format...')
            const history = sortedTimestamps.map((timestamp, idx) => {
                const telemetry = {}
                grouped.forEach((points, tagName) => {
                    const key = tagNameToKey(tagName)
                    if (!key) return

                    // Find the point closest to this timestamp
                    let closestPoint = null
                    let minDiff = Infinity
                    for (const point of points) {
                        const pointTime = new Date(point.ts).getTime()
                        const diff = Math.abs(pointTime - timestamp.getTime())
                        if (diff < minDiff) {
                            minDiff = diff
                            closestPoint = point
                        }
                    }

                    if (closestPoint) {
                        const val = closestPoint.value
                        if (val === 'true' || val === '1') {
                            telemetry[key] = true
                        } else if (val === 'false' || val === '0') {
                            telemetry[key] = false
                        } else {
                            telemetry[key] = parseFloat(val) || 0
                        }
                    }
                })
                return { timestamp, data: telemetry }
            })

            console.log('[fetchHistoricalData] Created history array with', history.length, 'frames')
            console.log('[fetchHistoricalData] Sample frame data:', history[0]?.data)

            setIsLoading(false)
            console.log('[fetchHistoricalData] SUCCESS! Returning history data')
            return { history, grouped, timestamps: sortedTimestamps }
        } catch (err) {
            console.error('[fetchHistoricalData] ERROR:', err.message)
            console.error('[fetchHistoricalData] Full error:', err)
            setError(`Failed to fetch historical data: ${err.message}`)
            setIsLoading(false)
            return null
        }
    }, [])

    /**
     * Get telemetry state at a specific playback index
     */
    const getStateAtIndex = useCallback((index, history) => {
        console.log('[getStateAtIndex] Getting state at index:', index, 'of', history?.length)
        if (!history || index < 0 || index >= history.length) {
            console.warn('[getStateAtIndex] Invalid index or no history')
            return null
        }
        return history[index].data
    }, [])

    /**
     * Get telemetry from grouped data at specific timestamp
     */
    const getStateFromGrouped = useCallback((targetTime, grouped) => {
        console.log('[getStateFromGrouped] Getting state for timestamp:', targetTime)
        if (!grouped || grouped.size === 0) {
            console.warn('[getStateFromGrouped] No grouped data available')
            return null
        }

        const telemetry = {}

        grouped.forEach((points, tagName) => {
            const key = tagNameToKey(tagName)
            if (!key) return

            // Find closest point to target time
            let closestPoint = null
            let minDiff = Infinity

            for (const point of points) {
                const pointTime = new Date(point.ts).getTime()
                const diff = Math.abs(pointTime - targetTime.getTime())
                if (diff < minDiff) {
                    minDiff = diff
                    closestPoint = point
                }
            }

            if (closestPoint) {
                // Parse value
                const val = closestPoint.value
                if (val === 'true' || val === '1') {
                    telemetry[key] = true
                } else if (val === 'false' || val === '0') {
                    telemetry[key] = false
                } else {
                    telemetry[key] = parseFloat(val) || 0
                }
            }
        })

        console.log('[getStateFromGrouped] Built telemetry with', Object.keys(telemetry).length, 'values')
        return telemetry
    }, [])

    return {
        isLoading,
        error,
        playbackData,
        playbackTimestamps,
        fetchHistoricalData,
        getStateAtIndex,
        getStateFromGrouped
    }
}

export default useHistory
