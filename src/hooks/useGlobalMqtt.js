import { useState, useEffect, useCallback, useRef } from 'react'
import mqtt from 'mqtt'
import { useStore, mockData } from '../store/store'

/**
 * Global MQTT hook that listens to MQTT messages and automatically
 * updates the store selection (port, equipment) based on incoming data.
 * 
 * The MQTT message format includes:
 * - site: The port/site identifier (e.g., "sma" -> "SMA")
 * - terminal: The terminal identifier (e.g., "terminal1")
 * - type: The equipment type (e.g., "Grue Mobile")
 * - host: The equipment code (e.g., "MM1GM11701")
 */
export const useGlobalMqtt = (options = {}) => {
    const {
        brokerUrl = 'ws://localhost:9001',
        topic = 'site/pi5/generator/snapshot',
        enabled = true,
    } = options

    const [isConnected, setIsConnected] = useState(false)
    const [error, setError] = useState(null)
    const [lastMessage, setLastMessage] = useState(null)
    const [detectedSite, setDetectedSite] = useState(null)
    const [detectedHost, setDetectedHost] = useState(null)
    const [detectedTerminal, setDetectedTerminal] = useState(null)
    const [detectedType, setDetectedType] = useState(null)
    const clientRef = useRef(null)

    const {
        setSelectedPort,
        setSelectedEquipment,
        setSelectedTerminal,
        setSelectedCategory,
        selectedPort,
        selectedEquipment,
        selectedTerminal,
        selectedCategory,
    } = useStore()

    // Find port by site code (case-insensitive)
    const findPortBySite = useCallback((siteCode) => {
        if (!siteCode) return null
        const normalizedSite = siteCode.toUpperCase()
        return mockData.ports.find(port =>
            port.id.toUpperCase() === normalizedSite ||
            port.name.toUpperCase() === normalizedSite
        )
    }, [])

    // Find terminal by ID or name (case-insensitive)
    const findTerminal = useCallback((terminalCode) => {
        if (!terminalCode) return null
        const normalized = terminalCode.toLowerCase().replace(/\s+/g, '-')
        return mockData.terminals.find(t =>
            t.id.toLowerCase() === normalized ||
            t.name.toLowerCase() === terminalCode.toLowerCase() ||
            t.id.toLowerCase() === terminalCode.toLowerCase()
        )
    }, [])

    // Find category by type name (case-insensitive)
    const findCategory = useCallback((typeName) => {
        if (!typeName) return null
        const normalized = typeName.toLowerCase()
        return mockData.categories.find(cat =>
            cat.name.toLowerCase() === normalized ||
            cat.id.toLowerCase().includes(normalized.split(' ')[0].toLowerCase())
        )
    }, [])

    // Find equipment by host code
    const findEquipmentByHost = useCallback((hostCode) => {
        if (!hostCode) return null
        // Match equipment by ID or name containing the host code
        return mockData.equipment.find(eq =>
            eq.id === hostCode ||
            eq.name.includes(hostCode) ||
            eq.id.toUpperCase() === hostCode.toUpperCase()
        )
    }, [])

    // Process incoming MQTT message and update selection
    const processMessage = useCallback((payload) => {
        const site = payload.site
        const host = payload.host
        const terminal = payload.terminal
        const type = payload.type

        setDetectedSite(site)
        setDetectedHost(host)
        setDetectedTerminal(terminal)
        setDetectedType(type)

        // Update port selection based on site
        if (site) {
            const port = findPortBySite(site)
            if (port && (!selectedPort || selectedPort.id !== port.id)) {
                console.log(`[GlobalMQTT] Auto-selecting port: ${port.name} (from site: ${site})`)
                setSelectedPort(port)
            }
        }

        // Update terminal selection based on terminal
        if (terminal) {
            const terminalObj = findTerminal(terminal)
            if (terminalObj && (!selectedTerminal || selectedTerminal.id !== terminalObj.id)) {
                console.log(`[GlobalMQTT] Auto-selecting terminal: ${terminalObj.name} (from terminal: ${terminal})`)
                setSelectedTerminal(terminalObj)
            }
        }

        // Update category selection based on type
        if (type) {
            const category = findCategory(type)
            if (category && (!selectedCategory || selectedCategory.id !== category.id)) {
                console.log(`[GlobalMQTT] Auto-selecting category: ${category.name} (from type: ${type})`)
                setSelectedCategory(category)
            }
        }

        // Update equipment selection based on host
        if (host) {
            const equipment = findEquipmentByHost(host)
            if (equipment) {
                // Add to selection if not already selected
                if (!selectedEquipment.includes(equipment.id)) {
                    console.log(`[GlobalMQTT] Auto-selecting equipment: ${equipment.id} (from host: ${host})`)
                    setSelectedEquipment([...selectedEquipment, equipment.id])
                }
            } else {
                // Equipment not found in mock data
                console.log(`[GlobalMQTT] Equipment ${host} not found in mock data`)
            }
        }
    }, [findPortBySite, findTerminal, findCategory, findEquipmentByHost, selectedPort, selectedTerminal, selectedCategory, selectedEquipment, setSelectedPort, setSelectedTerminal, setSelectedCategory, setSelectedEquipment])

    // Connect to MQTT and listen for messages
    useEffect(() => {
        if (!enabled) return

        const connectMqtt = async () => {
            try {
                console.log(`[GlobalMQTT] Connecting to ${brokerUrl} with topic ${topic}`)

                const client = mqtt.connect(brokerUrl, {
                    clientId: `ems-global-${Math.random().toString(16).slice(2, 8)}`,
                    clean: true,
                    connectTimeout: 5000,
                    reconnectPeriod: 3000,
                })

                clientRef.current = client

                client.on('connect', () => {
                    console.log('[GlobalMQTT] Connected to broker')
                    setIsConnected(true)
                    setError(null)
                    client.subscribe(topic, (err) => {
                        if (err) {
                            console.error('[GlobalMQTT] Subscription error:', err)
                            setError(`Subscription error: ${err.message}`)
                        } else {
                            console.log('[GlobalMQTT] Subscribed to:', topic)
                        }
                    })
                })

                client.on('message', (receivedTopic, message) => {
                    try {
                        const payload = JSON.parse(message.toString())
                        setLastMessage({
                            topic: receivedTopic,
                            payload,
                            timestamp: new Date().toISOString(),
                        })
                        processMessage(payload)
                    } catch (e) {
                        console.error('[GlobalMQTT] Failed to parse message:', e)
                    }
                })

                client.on('error', (err) => {
                    console.error('[GlobalMQTT] Error:', err)
                    setError(`MQTT error: ${err.message}`)
                    setIsConnected(false)
                })

                client.on('close', () => {
                    console.log('[GlobalMQTT] Connection closed')
                    setIsConnected(false)
                })

                client.on('reconnect', () => {
                    console.log('[GlobalMQTT] Reconnecting...')
                })

            } catch (err) {
                console.error('[GlobalMQTT] Connection error:', err)
                setError(`Connection error: ${err.message}`)
            }
        }

        connectMqtt()

        return () => {
            if (clientRef.current) {
                console.log('[GlobalMQTT] Disconnecting...')
                clientRef.current.end()
                clientRef.current = null
            }
        }
    }, [enabled, brokerUrl, topic, processMessage])

    const reconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.reconnect()
        }
    }, [])

    return {
        isConnected,
        error,
        lastMessage,
        detectedSite,
        detectedHost,
        detectedTerminal,
        detectedType,
        reconnect,
    }
}

export default useGlobalMqtt
