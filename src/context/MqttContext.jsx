import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import * as mqtt from 'mqtt'
// import { connect as mqttConnect } from 'mqtt'
// console.log('[MqttContext] Module loaded, mqtt connect:', typeof mqttConnect)

/**
 * MQTT Context
 * Provides a single shared MQTT connection for the entire app
 * All components subscribe through this context instead of creating individual connections
 */

const MqttContext = createContext(null)

// Connection states
export const CONNECTION_STATUS = {
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error'
}

// Default broker URL
const DEFAULT_BROKER_URL = 'ws://localhost:8000/mqtt'

export function MqttProvider({
    children,
    brokerUrl = DEFAULT_BROKER_URL,
    options = {}
}) {
    const [status, setStatus] = useState(CONNECTION_STATUS.DISCONNECTED)
    const [error, setError] = useState(null)
    const clientRef = useRef(null)
    const subscribersRef = useRef(new Map()) // Map<topic, Set<callback>>
    const retryCountRef = useRef(0)
    const maxRetries = options.maxRetries ?? 10

    // Calculate exponential backoff delay
    const getBackoffDelay = useCallback(() => {
        const baseDelay = 1000
        const maxDelay = 30000
        const delay = Math.min(baseDelay * Math.pow(2, retryCountRef.current), maxDelay)
        return delay + Math.random() * 1000 // Add jitter
    }, [])

    // Connect to MQTT broker
    const connect = useCallback(() => {
        if (clientRef.current?.connected) return

        setStatus(CONNECTION_STATUS.CONNECTING)
        setError(null)

        // const client = mqttConnect(brokerUrl, {
        //    clientId: `ems-frontend-${Date.now()}`,
        //    clean: true,
        //    reconnectPeriod: 0,
        //    connectTimeout: 10000,
        //    ...options
        // })
        let connectFn = mqtt.connect
        if (!connectFn && mqtt.default && mqtt.default.connect) {
            connectFn = mqtt.default.connect
        }

        const client = connectFn(brokerUrl, {
            clientId: `ems-frontend-${Date.now()}`,
            clean: true,
            reconnectPeriod: 0,
            connectTimeout: 10000,
            ...options
        })

        clientRef.current = client

        client.on('connect', () => {
            console.log('[MqttContext] Connected to broker')
            setStatus(CONNECTION_STATUS.CONNECTED)
            setError(null)
            retryCountRef.current = 0

            // Re-subscribe to all active topics
            subscribersRef.current.forEach((_, topic) => {
                client.subscribe(topic, { qos: 0 })
            })
        })

        client.on('message', (topic, message) => {
            try {
                const payload = JSON.parse(message.toString())

                // Notify all subscribers for this exact topic
                const exactCallbacks = subscribersRef.current.get(topic)
                if (exactCallbacks) {
                    exactCallbacks.forEach(cb => cb(topic, payload))
                }

                // Also check wildcard subscriptions
                subscribersRef.current.forEach((callbacks, pattern) => {
                    if (pattern.includes('+') || pattern.includes('#')) {
                        if (topicMatchesPattern(topic, pattern)) {
                            callbacks.forEach(cb => cb(topic, payload))
                        }
                    }
                })
            } catch (err) {
                console.warn('[MqttContext] Failed to parse message:', err)
            }
        })

        client.on('error', (err) => {
            console.error('[MqttContext] Connection error:', err)
            setError(err.message)
            setStatus(CONNECTION_STATUS.ERROR)
        })

        client.on('close', () => {
            console.log('[MqttContext] Connection closed')
            setStatus(CONNECTION_STATUS.DISCONNECTED)

            // Attempt reconnection with exponential backoff
            if (retryCountRef.current < maxRetries) {
                retryCountRef.current++
                const delay = getBackoffDelay()
                console.log(`[MqttContext] Reconnecting in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`)
                setStatus(CONNECTION_STATUS.RECONNECTING)
                setTimeout(connect, delay)
            } else {
                setError(`Failed to connect after ${maxRetries} attempts`)
            }
        })

        client.on('offline', () => {
            setStatus(CONNECTION_STATUS.DISCONNECTED)
        })
    }, [brokerUrl, options, getBackoffDelay, maxRetries])

    // Disconnect from broker
    const disconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.end(true)
            clientRef.current = null
        }
        setStatus(CONNECTION_STATUS.DISCONNECTED)
        retryCountRef.current = 0
    }, [])

    // Subscribe to a topic
    const subscribe = useCallback((topic, callback) => {
        if (!subscribersRef.current.has(topic)) {
            subscribersRef.current.set(topic, new Set())
            // Subscribe on broker if connected
            if (clientRef.current?.connected) {
                clientRef.current.subscribe(topic, { qos: 0 })
            }
        }
        subscribersRef.current.get(topic).add(callback)

        // Return unsubscribe function
        return () => {
            const callbacks = subscribersRef.current.get(topic)
            if (callbacks) {
                callbacks.delete(callback)
                if (callbacks.size === 0) {
                    subscribersRef.current.delete(topic)
                    if (clientRef.current?.connected) {
                        clientRef.current.unsubscribe(topic)
                    }
                }
            }
        }
    }, [])

    // Publish to a topic
    const publish = useCallback((topic, message) => {
        if (clientRef.current?.connected) {
            const payload = typeof message === 'string' ? message : JSON.stringify(message)
            clientRef.current.publish(topic, payload)
        }
    }, [])

    // Connect on mount
    useEffect(() => {
        connect()
        return () => disconnect()
    }, [connect, disconnect])

    const value = useMemo(() => ({
        status,
        error,
        isConnected: status === CONNECTION_STATUS.CONNECTED,
        isReconnecting: status === CONNECTION_STATUS.RECONNECTING,
        subscribe,
        publish,
        connect,
        disconnect
    }), [status, error, subscribe, publish, connect, disconnect])

    return (
        <MqttContext.Provider value={value}>
            {children}
        </MqttContext.Provider>
    )
}

// Hook to access MQTT context
export function useMqttContext() {
    const context = useContext(MqttContext)
    if (!context) {
        throw new Error('useMqttContext must be used within MqttProvider')
    }
    return context
}

// Hook to subscribe to a specific topic
export function useMqttSubscription(topic, onMessage) {
    const { subscribe, isConnected } = useMqttContext()
    const [lastMessage, setLastMessage] = useState(null)

    useEffect(() => {
        if (!topic) return

        const handleMessage = (receivedTopic, payload) => {
            setLastMessage({ topic: receivedTopic, payload, timestamp: Date.now() })
            onMessage?.(receivedTopic, payload)
        }

        const unsubscribe = subscribe(topic, handleMessage)
        return unsubscribe
    }, [topic, subscribe, onMessage])

    return { lastMessage, isConnected }
}

// Hook for equipment telemetry (simplified interface)
export function useEquipmentTelemetry(equipmentId, portId = 'sma') {
    const [telemetry, setTelemetry] = useState(null)
    const topic = equipmentId ? `${portId.toLowerCase()}/${equipmentId}` : null

    const handleMessage = useCallback((_, payload) => {
        if (payload?.data) {
            setTelemetry(payload.data)
        } else {
            setTelemetry(payload)
        }
    }, [])

    const { isConnected } = useMqttSubscription(topic, handleMessage)

    return { telemetry, isConnected }
}

// Helper: Check if topic matches a pattern with wildcards
function topicMatchesPattern(topic, pattern) {
    const topicParts = topic.split('/')
    const patternParts = pattern.split('/')

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i] === '#') {
            return true // # matches everything after
        }
        if (patternParts[i] !== '+' && patternParts[i] !== topicParts[i]) {
            return false
        }
    }

    return topicParts.length === patternParts.length
}

export default MqttContext
