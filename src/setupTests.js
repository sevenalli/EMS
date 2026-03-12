import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
}
global.localStorage = localStorageMock

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
})

// Mock AudioContext
class MockAudioContext {
    createOscillator() {
        return {
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            frequency: { value: 0 },
            type: 'sine'
        }
    }
    createGain() {
        return {
            connect: vi.fn(),
            gain: { value: 0 }
        }
    }
    get currentTime() {
        return 0
    }
    get destination() {
        return {}
    }
}
global.AudioContext = MockAudioContext

// Mock IntersectionObserver
class MockIntersectionObserver {
    constructor(callback) {
        this.callback = callback
    }
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.IntersectionObserver = MockIntersectionObserver

// Suppress console errors in tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {})
