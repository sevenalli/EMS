/**
 * Audio Notification Manager
 * Handles alarm sounds for different notification severities
 */

// Sound URLs (base64 encoded simple beeps as fallback)
// In production, replace with actual audio files in /public/sounds/
const SOUNDS = {
    critical: null, // Will be created dynamically
    alarm: null,
    warning: null,
    info: null
}

// Audio context for generating tones
let audioContext = null

/**
 * Initialize audio context (must be called after user interaction)
 */
function initAudioContext() {
    if (!audioContext && typeof AudioContext !== 'undefined') {
        audioContext = new AudioContext()
    }
    return audioContext
}

/**
 * Generate a beep tone
 */
function generateBeep(frequency = 440, duration = 200, volume = 0.3, type = 'sine') {
    const ctx = initAudioContext()
    if (!ctx) return null

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type
    gainNode.gain.value = volume

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration / 1000)

    return oscillator
}

/**
 * Notification sound configurations by severity
 */
const SOUND_CONFIGS = {
    Critical: {
        pattern: [
            { freq: 880, dur: 150, vol: 0.4 },
            { pause: 100 },
            { freq: 880, dur: 150, vol: 0.4 },
            { pause: 100 },
            { freq: 880, dur: 150, vol: 0.4 }
        ],
        repeat: 2,
        color: 'red'
    },
    Alarm: {
        pattern: [
            { freq: 660, dur: 200, vol: 0.35 },
            { pause: 100 },
            { freq: 660, dur: 200, vol: 0.35 }
        ],
        repeat: 1,
        color: 'orange'
    },
    Warning: {
        pattern: [
            { freq: 440, dur: 200, vol: 0.25 }
        ],
        repeat: 1,
        color: 'yellow'
    },
    Fault: {
        pattern: [
            { freq: 330, dur: 300, vol: 0.3 }
        ],
        repeat: 1,
        color: 'purple'
    },
    Info: {
        pattern: [
            { freq: 520, dur: 100, vol: 0.15 }
        ],
        repeat: 1,
        color: 'blue'
    }
}

/**
 * Play notification sound based on severity
 */
export async function playNotificationSound(severity = 'Info') {
    const config = SOUND_CONFIGS[severity] || SOUND_CONFIGS.Info

    // Check if muted
    if (isMuted()) return

    try {
        initAudioContext()

        for (let r = 0; r < config.repeat; r++) {
            for (const step of config.pattern) {
                if (step.pause) {
                    await sleep(step.pause)
                } else {
                    generateBeep(step.freq, step.dur, step.vol)
                    await sleep(step.dur)
                }
            }
            if (r < config.repeat - 1) {
                await sleep(300) // Gap between repeats
            }
        }
    } catch (error) {
        console.warn('[AudioNotifications] Error playing sound:', error)
    }
}

/**
 * Show browser notification (requires permission)
 */
export async function showBrowserNotification(title, options = {}) {
    if (!('Notification' in window)) {
        console.warn('[AudioNotifications] Browser notifications not supported')
        return false
    }

    let permission = Notification.permission

    if (permission === 'default') {
        permission = await Notification.requestPermission()
    }

    if (permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 100, 200],
            ...options
        })

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000)

        return notification
    }

    return null
}

/**
 * Play notification with optional browser notification
 */
export async function triggerNotification(severity, message, options = {}) {
    const {
        playSound = true,
        showBrowserNotif = false,
        body = ''
    } = options

    if (playSound && !isMuted()) {
        playNotificationSound(severity)
    }

    if (showBrowserNotif) {
        showBrowserNotification(message, {
            body,
            tag: severity,
            requireInteraction: severity === 'Critical'
        })
    }
}

// Mute state management
const MUTE_KEY = 'ems-audio-muted'

export function isMuted() {
    return localStorage.getItem(MUTE_KEY) === 'true'
}

export function setMuted(muted) {
    localStorage.setItem(MUTE_KEY, String(muted))
}

export function toggleMute() {
    const newState = !isMuted()
    setMuted(newState)
    return newState
}

// Request notification permission
export async function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        return await Notification.requestPermission()
    }
    return Notification.permission
}

// Helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
    playNotificationSound,
    showBrowserNotification,
    triggerNotification,
    isMuted,
    setMuted,
    toggleMute,
    requestNotificationPermission,
    SOUND_CONFIGS
}
