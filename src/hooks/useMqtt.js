import { useState, useEffect, useCallback, useRef } from 'react'
import mqtt from 'mqtt'

import { TAG_MAPPINGS } from '../data/telemetryData'

// Mock telemetry data for simulation
const generateMockTelemetry = (equipmentId) => {
    const baseValue = equipmentId.charCodeAt(0)
    return {
        ts: new Date().toISOString(),
        data: Object.entries(TAG_MAPPINGS).reduce((acc, [key, mqttKey]) => {
            acc[mqttKey] = Math.random() * 100
            return acc
        }, {})
    }
}

// Parse the telemetry data with friendly keys
const parseTelemetry = (payload) => {
    if (!payload) return null

    // Handle both wrapped (payload.data) and unwrapped payloads
    const data = payload.data || payload
    const parsed = {
        timestamp: payload.ts || payload.timestamp || new Date().toISOString(),
        // Extract metadata fields from MQTT message
        site: payload.site || null,
        terminal: payload.terminal || null,
        type: payload.type || null,
        host: payload.host || null,
    }

    // Map all keys from TAG_MAPPINGS - check both the data object and root payload
    Object.entries(TAG_MAPPINGS).forEach(([friendlyKey, mqttKey]) => {
        // First check in the data object
        if (data[mqttKey] !== undefined) {
            parsed[friendlyKey] = data[mqttKey]
        }
        // Also check for friendlyKey directly (in case data comes pre-mapped)
        else if (data[friendlyKey] !== undefined) {
            parsed[friendlyKey] = data[friendlyKey]
        }
        // Check root payload as well
        else if (payload[mqttKey] !== undefined) {
            parsed[friendlyKey] = payload[mqttKey]
        }
    })

    return parsed
}

/**
 * Custom hook for MQTT connection and telemetry data
 * @param {string} equipmentId - The ID of the equipment to monitor
 * @param {object} options - Configuration options
 * @param {boolean} options.useMock - Use mock data instead of real MQTT (default: true for MVP)
 * @param {string} options.brokerUrl - MQTT broker WebSocket URL
 * @param {string} options.topic - MQTT topic to subscribe to
 */
export const useMqtt = (equipmentId, options = {}) => {
    const {
        useMock = true,
        brokerUrl = 'ws://localhost:8000/mqtt',
        topic = 'site/pi5/generator/snapshot',
    } = options

    const [telemetry, setTelemetry] = useState(null)
    const [rawData, setRawData] = useState(null)
    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState(null)
    const clientRef = useRef(null)
    const intervalRef = useRef(null)

    // Mock data simulation
    useEffect(() => {
        if (!useMock || !equipmentId) return

        // Simulate initial connection delay
        const connectTimeout = setTimeout(() => {
            setIsConnected(true)
        }, 500)

        // Generate mock data periodically
        intervalRef.current = setInterval(() => {
            const mockPayload = generateMockTelemetry(equipmentId)
            const parsed = parseTelemetry(mockPayload)
            setTelemetry(parsed)
        }, 2000 + Math.random() * 1000) // Random interval for realism

        // Initial data
        const initialPayload = generateMockTelemetry(equipmentId)
        setTelemetry(parseTelemetry(initialPayload))

        return () => {
            clearTimeout(connectTimeout)
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [equipmentId, useMock])

    // Real MQTT connection (for future use)
    useEffect(() => {
        if (useMock || !equipmentId) return

        let isMounted = true

        const connectMqtt = async () => {
            try {
                console.log(`[useMqtt] Connecting to ${brokerUrl} with topic ${topic}`)

                const client = mqtt.connect(brokerUrl, {
                    clientId: `ems-${equipmentId}-${Math.random().toString(16).slice(2, 8)}`,
                    clean: true,
                    connectTimeout: 5000,
                    reconnectPeriod: 3000,
                })

                clientRef.current = client

                client.on('connect', () => {
                    // Only subscribe if the component is still mounted
                    if (!isMounted) {
                        client.end(true)
                        return
                    }
                    console.log('MQTT Connected to', brokerUrl)
                    setIsConnected(true)
                    setError(null)
                    client.subscribe(topic, (err) => {
                        if (err) {
                            console.error('Subscription error:', err)
                            setError(`Subscription error: ${err.message}`)
                        } else {
                            console.log('Subscribed to:', topic)
                        }
                    })
                })

                client.on('message', (receivedTopic, message) => {
                    try {
                        const payload = JSON.parse(message.toString())
                        const parsed = parseTelemetry(payload)
                        setTelemetry(parsed)
                        // Also expose raw data for notifications
                        setRawData(payload.data || payload)
                    } catch (e) {
                        console.error('Failed to parse MQTT message:', e)
                    }
                })

                client.on('error', (err) => {
                    console.error('MQTT Error:', err)
                    setError(`MQTT error: ${err.message}`)
                    setIsConnected(false)
                })

                client.on('close', () => {
                    setIsConnected(false)
                })

            } catch (err) {
                setError(`Connection error: ${err.message}`)
            }
        }

        connectMqtt()

        return () => {
            isMounted = false
            if (clientRef.current) {
                clientRef.current.end(true) // Force disconnect
                clientRef.current = null
            }
        }
    }, [equipmentId, useMock, brokerUrl, topic])

    const reconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.reconnect()
        }
    }, [])

    return {
        telemetry,
        rawData,
        isConnected,
        error,
        reconnect,
    }
}

export { TAG_MAPPINGS, parseTelemetry }
