import { useState, useEffect, useRef, useCallback } from 'react'
import mqtt from 'mqtt'
import { useStore } from '../store/store'
import { parseTelemetry } from './useMqtt'

/**
 * Hook for discovering active MQTT topics and tracking equipment online status.
 * Subscribes to wildcard topics to detect which equipment is actively publishing data.
 * 
 * Topic format: port/equipmentcode (e.g., SMA/MM1GM11702)
 * 
 * @param {object} options - Configuration options
 * @param {string} options.brokerUrl - MQTT broker WebSocket URL
 * @param {string} options.portFilter - Optional port to filter topics (e.g., 'SMA' subscribes to 'SMA/#')
 * @param {number} options.onlineThreshold - Time in ms before equipment is considered offline (default: 30000)
 */
export const useTopicDiscovery = (options = {}) => {
    const {
        brokerUrl = 'ws://localhost:8000/mqtt',
        portFilter = null,  // null = subscribe to all ('+/+')
        onlineThreshold = 30000,  // 30 seconds
    } = options

    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState(null)
    const [activeEquipment, setActiveEquipment] = useState({})  // { equipmentCode: { isOnline, lastSeen, port, latestData } }
    const [discoveredPorts, setDiscoveredPorts] = useState([])

    const clientRef = useRef(null)
    const updateIntervalRef = useRef(null)

    const { selectedPort } = useStore()

    // Parse topic to extract port and equipment code
    const parseTopic = useCallback((topic) => {
        // Expected format: port/equipmentcode (e.g., SMA/MM1GM11702)
        const parts = topic.split('/')
        if (parts.length >= 2) {
            return {
                port: parts[0].toUpperCase(),
                equipmentCode: parts[1]
            }
        }
        return null
    }, [])

    // Check if equipment is online based on lastSeen timestamp
    const checkOnlineStatus = useCallback(() => {
        const now = Date.now()
        setActiveEquipment(prev => {
            const updated = { ...prev }
            let hasChanges = false

            Object.keys(updated).forEach(code => {
                const wasOnline = updated[code].isOnline
                const isNowOnline = (now - updated[code].lastSeen) < onlineThreshold

                if (wasOnline !== isNowOnline) {
                    hasChanges = true
                    updated[code] = { ...updated[code], isOnline: isNowOnline }
                }
            })

            return hasChanges ? updated : prev
        })
    }, [onlineThreshold])

    // Connect to MQTT and subscribe to discovery topic
    useEffect(() => {
        let isMounted = true

        const connectMqtt = async () => {
            try {
                // Determine topic pattern - use lowercase for broker compatibility
                const topicPattern = portFilter ? `${portFilter.toLowerCase()}/#` : '+/+'
                console.log(`[TopicDiscovery] Connecting to ${brokerUrl}, subscribing to ${topicPattern}`)

                const client = mqtt.connect(brokerUrl, {
                    clientId: `ems-discovery-${Math.random().toString(16).slice(2, 8)}`,
                    clean: true,
                    connectTimeout: 5000,
                    reconnectPeriod: 3000,
                })

                clientRef.current = client

                client.on('connect', () => {
                    if (!isMounted) {
                        client.end(true)
                        return
                    }
                    console.log('[TopicDiscovery] Connected to broker')
                    setIsConnected(true)
                    setError(null)

                    client.subscribe(topicPattern, (err) => {
                        if (err) {
                            console.error('[TopicDiscovery] Subscription error:', err)
                            setError(`Subscription error: ${err.message}`)
                        } else {
                            console.log('[TopicDiscovery] Subscribed to:', topicPattern)
                        }
                    })
                })

                client.on('message', (topic, message) => {
                    try {
                        const parsed = parseTopic(topic)
                        if (!parsed) return

                        const { port, equipmentCode } = parsed
                        const payload = JSON.parse(message.toString())
                        const telemetry = parseTelemetry(payload)

                        // Update active equipment
                        setActiveEquipment(prev => ({
                            ...prev,
                            [equipmentCode]: {
                                isOnline: true,
                                lastSeen: Date.now(),
                                port,
                                topic,
                                latestData: telemetry,
                                rawPayload: payload
                            }
                        }))

                        // Track discovered ports
                        setDiscoveredPorts(prev => {
                            if (!prev.includes(port)) {
                                console.log(`[TopicDiscovery] New port discovered: ${port}`)
                                return [...prev, port]
                            }
                            return prev
                        })

                    } catch (e) {
                        console.error('[TopicDiscovery] Failed to parse message:', e)
                    }
                })

                client.on('error', (err) => {
                    console.error('[TopicDiscovery] Error:', err)
                    setError(`MQTT error: ${err.message}`)
                    setIsConnected(false)
                })

                client.on('close', () => {
                    console.log('[TopicDiscovery] Connection closed')
                    setIsConnected(false)
                })

            } catch (err) {
                console.error('[TopicDiscovery] Connection error:', err)
                setError(`Connection error: ${err.message}`)
            }
        }

        connectMqtt()

        // Set up interval to check online status
        updateIntervalRef.current = setInterval(checkOnlineStatus, 5000)

        return () => {
            isMounted = false
            if (clientRef.current) {
                clientRef.current.end(true)
                clientRef.current = null
            }
            if (updateIntervalRef.current) {
                clearInterval(updateIntervalRef.current)
            }
        }
    }, [brokerUrl, portFilter, parseTopic, checkOnlineStatus])

    // Helper: Check if a specific equipment is online
    const isEquipmentOnline = useCallback((equipmentCode) => {
        const equipment = activeEquipment[equipmentCode]
        return equipment?.isOnline ?? false
    }, [activeEquipment])

    // Helper: Get all equipment for a specific port
    const getEquipmentByPort = useCallback((portId) => {
        return Object.entries(activeEquipment)
            .filter(([_, data]) => data.port === portId.toUpperCase())
            .map(([code, data]) => ({ code, ...data }))
    }, [activeEquipment])

    // Helper: Get latest telemetry for equipment
    const getEquipmentData = useCallback((equipmentCode) => {
        return activeEquipment[equipmentCode] || null
    }, [activeEquipment])

    // Get list of online equipment codes
    const onlineEquipmentCodes = Object.entries(activeEquipment)
        .filter(([_, data]) => data.isOnline)
        .map(([code]) => code)

    return {
        isConnected,
        error,
        activeEquipment,
        discoveredPorts,
        onlineEquipmentCodes,
        isEquipmentOnline,
        getEquipmentByPort,
        getEquipmentData,
    }
}

export default useTopicDiscovery
