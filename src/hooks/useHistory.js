import { useState, useCallback } from 'react'
import { TAG_MAPPINGS } from '../data/telemetryData'
import { fetchEquipmentHistory } from '../api/HistoryService'

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
     * @param {string} equipmentId - Equipment ID to fetch history for
     */
    const fetchHistoricalData = useCallback(async (timeRange, customTags = null, equipmentId = 'MM1GM11701') => {
        const tagNames = customTags || HISTORY_TAG_NAMES
        console.log('[fetchHistoricalData] Starting fetch for equipment:', equipmentId, 'time range:', timeRange)
        setIsLoading(true)
        setError('')

        // Calculate time range using helper (imported or local logic)
        const endTime = new Date()
        const startTime = new Date()
        if (timeRange.unit === 'hours') {
            startTime.setHours(startTime.getHours() - timeRange.value)
        } else if (timeRange.unit === 'days') {
            startTime.setDate(startTime.getDate() - timeRange.value)
        }

        try {
            // Use HistoryService
            const historyData = await fetchEquipmentHistory(equipmentId, startTime, endTime, [])

            if (!historyData || historyData.length === 0) {
                console.warn('[fetchHistoricalData] No data returned from API')
                setError('No data found for the selected time range')
                setIsLoading(false)
                return null
            }

            console.log('[fetchHistoricalData] Received', historyData.length, 'data points from service')
            console.log('[fetchHistoricalData] Sample data point (from Service):', historyData[0])

            // Transform flattened service data to grouped format for playback logic
            // Service returns: [{ ts, fuelLevel: 45, chargeNette: 12 }, ...] (Normalized Keys)
            // Grouped needs: Map<tagName, [{ ts, tagName, value }]>
            // NEW OPTIMIZED LOGIC: 
            // The HistoryService data is ALREADY a row-based array: [{ ts: "...", tag1: val, tag2: val }]
            // We just need to convert it to the playback format: [{ timestamp: Date, data: { tag1: val... } }]
            console.log('[fetchHistoricalData] Converting to history array format (Optimized)...');

            const history = historyData.map(row => {
                const timestamp = new Date(row.ts);
                const telemetry = { ...row };
                delete telemetry.ts; // remove timestamp from data object

                // Parse booleans/floats if needed (though Service should have raw values)
                Object.keys(telemetry).forEach(key => {
                    const val = telemetry[key];
                    if (val === 'true' || val === '1' || val === true) {
                        telemetry[key] = true;
                    } else if (val === 'false' || val === '0' || val === false) {
                        telemetry[key] = false;
                    } else if (typeof val === 'string' && !isNaN(parseFloat(val))) {
                        telemetry[key] = parseFloat(val);
                    }
                });

                return { timestamp, data: telemetry };
            });

            // Timestamps for slider
            const sortedTimestamps = history.map(h => h.timestamp).sort((a, b) => a.getTime() - b.getTime());
            setPlaybackTimestamps(sortedTimestamps);

            console.log('[fetchHistoricalData] Created history array with', history.length, 'frames');

            // We can return null for 'grouped' since we don't use it anymore for playback generation
            setIsLoading(false);
            return { history, grouped: new Map(), timestamps: sortedTimestamps };
        } catch (err) {
            console.error('[fetchHistoricalData] ERROR:', err.message)
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
