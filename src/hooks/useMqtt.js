import { useState, useEffect, useCallback, useRef } from 'react'

// Key mappings from spec
const KEY_MAPPINGS = {
    engine_hours: 'Compteur_d_heures_de_service_heures',
    load_weight: 'Charge_brute_en_tonnes',
    wind_speed: 'Vitesse_du_vent_valeur_reelle',
    fuel_level: 'Reservoir_de_carburant_diesel_niveau_de_remplissage_en',
    is_active: 'Kranhauptschalter_ist_EIN',
    hydraulic_temp: 'Temperature_du_systeme_hydraulique',
    diesel_running: 'Dieselmotor_in_Betrieb',
    motor_temp: 'Mec_levage_1_temperature_du_moteur_en_degres_Celsius',
}

// Mock telemetry data for simulation
const generateMockTelemetry = (equipmentId) => {
    const baseValue = equipmentId.charCodeAt(0)
    return {
        ts: new Date().toISOString(),
        data: {
            [KEY_MAPPINGS.hydraulic_temp]: 45 + Math.random() * 20,
            [KEY_MAPPINGS.engine_hours]: 100 + Math.floor(Math.random() * 500),
            [KEY_MAPPINGS.is_active]: Math.random() > 0.3,
            [KEY_MAPPINGS.load_weight]: 5 + Math.random() * 15,
            [KEY_MAPPINGS.wind_speed]: Math.floor(Math.random() * 20),
            [KEY_MAPPINGS.fuel_level]: 40 + Math.random() * 50,
            [KEY_MAPPINGS.diesel_running]: Math.random() > 0.4,
            [KEY_MAPPINGS.motor_temp]: 30 + Math.random() * 15,
        }
    }
}

// Parse the telemetry data with friendly keys
const parseTelemetry = (payload) => {
    if (!payload?.data) return null

    const data = payload.data
    return {
        timestamp: payload.ts,
        engineHours: data[KEY_MAPPINGS.engine_hours] || 0,
        loadWeight: data[KEY_MAPPINGS.load_weight] || 0,
        windSpeed: data[KEY_MAPPINGS.wind_speed] || 0,
        fuelLevel: data[KEY_MAPPINGS.fuel_level] || 0,
        isActive: data[KEY_MAPPINGS.is_active] ?? false,
        hydraulicTemp: data[KEY_MAPPINGS.hydraulic_temp] || 0,
        dieselRunning: data[KEY_MAPPINGS.diesel_running] ?? false,
        motorTemp: data[KEY_MAPPINGS.motor_temp] || 0,
    }
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
        brokerUrl = 'ws://localhost:9001',
        topic = 'site/pi5/generator/snapshot',
    } = options

    const [telemetry, setTelemetry] = useState(null)
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

        const connectMqtt = async () => {
            try {
                // Dynamic import for MQTT client
                const mqtt = await import('mqtt')

                const client = mqtt.connect(brokerUrl, {
                    clientId: `ems-${equipmentId}-${Math.random().toString(16).slice(2, 8)}`,
                    clean: true,
                    connectTimeout: 5000,
                    reconnectPeriod: 3000,
                })

                clientRef.current = client

                client.on('connect', () => {
                    setIsConnected(true)
                    setError(null)
                    client.subscribe(topic, (err) => {
                        if (err) {
                            setError(`Subscription error: ${err.message}`)
                        }
                    })
                })

                client.on('message', (receivedTopic, message) => {
                    try {
                        const payload = JSON.parse(message.toString())
                        const parsed = parseTelemetry(payload)
                        setTelemetry(parsed)
                    } catch (e) {
                        console.error('Failed to parse MQTT message:', e)
                    }
                })

                client.on('error', (err) => {
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
            if (clientRef.current) {
                clientRef.current.end()
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
        isConnected,
        error,
        reconnect,
    }
}

export { KEY_MAPPINGS, parseTelemetry }
