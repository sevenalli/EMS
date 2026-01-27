/**
 * History Service
 * Connects to Java Backend for equipment history data
 * 
 * Java Backend Endpoint:
 * - POST /api/history/tags
 * - Body: { equipmentId, startTime, endTime, tags }
 * - Response: [{ time: "...", data: { ...raw_json... } }]
 */

import { TAG_MAPPINGS } from '../data/telemetryData';

// API Base URL - uses Vite proxy to forward to Java backend (localhost:8080)
const API_BASE_URL = '/api';

/**
 * Fetch equipment history from Java backend
 * 
 * @param {string} equipmentId - Equipment ID (e.g., "MM1GM11701")
 * @param {Date|string} startTime - Start time (ISO string or Date object)
 * @param {Date|string} endTime - End time (ISO string or Date object)
 * @param {string[]} tags - Optional array of tag names (backend returns all if empty)
 * @returns {Promise<Array>} - Array of objects with { ts, ...normalizedData }
 */
export const fetchEquipmentHistory = async (equipmentId, startTime, endTime, tags = []) => {
    const requestBody = {
        equipmentId: equipmentId,
        startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
        endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
        tags: tags
    };

    try {
        const response = await fetch(`${API_BASE_URL}/history/tags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[HistoryService] API error:', response.status, errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // Transform Java backend response to frontend format with NORMALIZED keys
        return transformHistoryData(data);
    } catch (error) {
        console.error('[HistoryService] Fetch error:', error);
        throw error;
    }
};

// Pre-calculate reverse mapping for O(1) lookup: { "Raw_Tag_Name": "friendlyKey" }
const REVERSE_TAG_MAPPINGS = Object.entries(TAG_MAPPINGS).reduce((acc, [friendly, raw]) => {
    acc[raw] = friendly;
    return acc;
}, {});

/**
 * Transform Java backend response to frontend chart format
 * normalization logic mapping raw PLC tags to friendly keys
 * 
 * @param {Array} responseData - Raw API response
 * @returns {Array} - Transformed data with friendly keys (e.g. { ts: "...", powerKw: 123 })
 */
export const transformHistoryData = (responseData) => {
    if (!Array.isArray(responseData)) {
        console.warn('[HistoryService] Expected array, got:', typeof responseData);
        return [];
    }

    return responseData.map((row, index) => {
        let rawTags = {};
        let timestamp = row.time;

        // 1. EXTRACT DATA source
        const dataObj = row.data || {};

        // CASE A: Data is in 'value' as stringified JSON (Single Point / Text format)
        if (dataObj.value && typeof dataObj.value === 'string') {
            try {
                const parsed = JSON.parse(dataObj.value);
                // parsed structure: { ts: "...", data: { ... } } or just { ... }
                if (parsed.data) {
                    rawTags = parsed.data;
                } else {
                    rawTags = parsed;
                }

                // Timestamp priority: outer row.data.time > inner parsed.ts
                if (dataObj.time) timestamp = dataObj.time;
                else if (parsed.ts) timestamp = parsed.ts;

            } catch (e) {
                console.error('[HistoryService] Error parsing row.data.value:', e);
            }
        }
        // CASE B: Standard Object format
        else {
            // Unwrap tags from .value, .data, or root
            const jsonPayload = row.tags || row.data || {};
            rawTags = jsonPayload.value || jsonPayload.data || jsonPayload;
        }

        const normalized = { ts: timestamp };

        // 2. NORMALIZE KEYS (Optimized Loop)
        // Iterate only the keys present in the data, not the entire mapping config
        Object.keys(rawTags).forEach(key => {
            // Clean key (remove nulls/trim)
            const cleanKey = key.trim().replace(/\u0000/g, '');
            const val = rawTags[key];

            // Direct Lookup
            const friendlyKey = REVERSE_TAG_MAPPINGS[cleanKey];

            if (friendlyKey) {
                // Handle nested value objects { value: 123 }
                if (val && typeof val === 'object' && 'value' in val) {
                    normalized[friendlyKey] = val.value;
                } else {
                    normalized[friendlyKey] = val;
                }
            }
            // FALLBACK for Single Point { null: "TagName", value: 123 }
            else if (cleanKey === 'null' || cleanKey === 'type') {
                // Check if the value of 'null'/'type' key is actually a Tag Name
                if (typeof val === 'string') {
                    const tagName = val.trim().replace(/\u0000/g, '');
                    const fallbackFriendly = REVERSE_TAG_MAPPINGS[tagName];
                    if (fallbackFriendly && rawTags.value !== undefined) {
                        normalized[fallbackFriendly] = rawTags.value;
                    } else if (rawTags.value !== undefined) {
                        // Keep raw tag name if no friendly mapping found
                        normalized[tagName] = rawTags.value;
                    }
                }
            }
            // PRESERVE UNMAPPED RAW KEYS
            else {
                if (val && typeof val === 'object' && 'value' in val) {
                    normalized[cleanKey] = val.value;
                } else {
                    normalized[cleanKey] = val;
                }
            }
        });

        return normalized;
    });
};

/**
 * Helper to calculate time range from a preset
 * 
 * @param {object} timeRange - { unit: 'hours'|'days', value: number }
 * @returns {object} - { startTime: Date, endTime: Date }
 */
export const calculateTimeRange = (timeRange) => {
    const endTime = new Date();
    const startTime = new Date();

    if (timeRange.unit === 'hours') {
        startTime.setHours(startTime.getHours() - timeRange.value);
    } else if (timeRange.unit === 'days') {
        startTime.setDate(startTime.getDate() - timeRange.value);
    } else if (timeRange.unit === 'minutes') {
        startTime.setMinutes(startTime.getMinutes() - timeRange.value);
    }

    return { startTime, endTime };
};

export const fetchHistoryByTimeRange = async (equipmentId, timeRange, tags = []) => {
    const { startTime, endTime } = calculateTimeRange(timeRange);
    return fetchEquipmentHistory(equipmentId, startTime, endTime, tags);
};

export default {
    fetchEquipmentHistory,
    fetchHistoryByTimeRange,
    transformHistoryData,
    calculateTimeRange
};
