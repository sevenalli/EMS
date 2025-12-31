import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(
    persist(
        (set) => ({
            // Theme
            isDarkMode: false,
            toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

            // Navigation state
            selectedService: null,
            selectedPort: null,
            selectedTerminal: null,
            selectedCategory: null,
            selectedEquipment: [],

            // Actions
            setSelectedService: (service) => set({ selectedService: service }),
            setSelectedPort: (port) => set({ selectedPort: port }),
            setSelectedTerminal: (terminal) => set({ selectedTerminal: terminal }),
            setSelectedCategory: (category) => set({ selectedCategory: category }),
            setSelectedEquipment: (equipment) => set({ selectedEquipment: equipment }),
            toggleEquipment: (equipmentId) => set((state) => {
                const isSelected = state.selectedEquipment.includes(equipmentId)
                return {
                    selectedEquipment: isSelected
                        ? state.selectedEquipment.filter(id => id !== equipmentId)
                        : [...state.selectedEquipment, equipmentId]
                }
            }),

            // Reset functions
            resetSelection: () => set({
                selectedService: null,
                selectedPort: null,
                selectedTerminal: null,
                selectedCategory: null,
                selectedEquipment: [],
            }),
        }),
        {
            name: 'ems-storage',
            partialize: (state) => ({ isDarkMode: state.isDarkMode }),
        }
    )
)

// Mock data for the application
export const mockData = {
    services: [
        { id: '3d-realtime', name: '3D Temps réel', icon: 'Box', color: 'primary' },
        { id: '3d-playback', name: '3D Play Back', icon: 'PlayCircle', color: 'primary' },
        { id: 'monitoring', name: 'Monitoring des engins', icon: 'Activity', color: 'accent' },
        { id: 'maintenance', name: 'Maintenance', icon: 'Wrench', color: 'secondary' },
        { id: 'exploitation', name: 'Exploitation', icon: 'BarChart3', color: 'secondary' },
        { id: 'performance', name: 'Performance', icon: 'TrendingUp', color: 'success' },
        { id: 'security', name: 'Sécurité', icon: 'Shield', color: 'danger' },
        { id: 'diagnostic', name: 'Diagnostique', icon: 'Stethoscope', color: 'secondary' },
        { id: 'rse', name: 'RSE', icon: 'Leaf', color: 'success' },
    ],

    ports: [
        { id: 'DEPJL', name: 'DEPJL', image: 'port1' },
        { id: 'DEPA', name: 'DEPA', image: 'port2' },
        { id: 'SMA', name: 'SMA', image: 'port3' },
        { id: 'DEPT', name: 'DEPT', image: 'port4' },
        { id: 'TC3PC', name: 'TC3PC', image: 'port5' },
        { id: 'DEPL', name: 'DEPL', image: 'port6' },
        { id: 'DEPN', name: 'DEPN', image: 'port7' },
        { id: 'DEPS', name: 'DEPS', image: 'port8' },
        { id: 'DEPD', name: 'DEPD', image: 'port9' },
    ],

    terminals: [
        { id: 'terminal-1', name: 'Terminal 1', portId: 'DEPJL' },
        { id: 'terminal-2', name: 'Terminal 2', portId: 'DEPJL' },
        { id: 'terminal-3', name: 'Terminal 3', portId: 'DEPA' },
    ],

    categories: [
        { id: 'grue-mobile', name: 'Grue Mobile', icon: 'Crane' },
        { id: 'portique', name: 'Portique', icon: 'Container' },
        { id: 'chariot', name: 'Chariot élévateur', icon: 'Truck' },
        { id: 'reachstacker', name: 'Reach Stacker', icon: 'Package' },
    ],

    // Equipment with crane type, accessory, status, and notifications
    equipment: [
        {
            id: 'MM1GM11701',
            name: 'Grue Mobile MM1GM11701',
            categoryId: 'grue-mobile',
            terminalId: 'terminal-1',
            portId: 'SMA',
            status: 'active',
            craneType: 1,
            accessory: 'spreader',
            notifications: 0
        },
        {
            id: 'G380003',
            name: 'Grue G380003',
            categoryId: 'grue-mobile',
            terminalId: 'terminal-1',
            status: 'affected',  // off, standby, affected, maintenance
            craneType: 1,        // 1, 2, or 3 for different crane images
            accessory: 'benne',  // benne, spreader, twinlift
            notifications: 3
        },
        {
            id: 'G380004',
            name: 'Grue G380004',
            categoryId: 'grue-mobile',
            terminalId: 'terminal-1',
            status: 'off',
            craneType: 2,
            accessory: 'spreader',
            notifications: 0
        },
        {
            id: 'G380005',
            name: 'Grue G380005',
            categoryId: 'grue-mobile',
            terminalId: 'terminal-2',
            status: 'standby',
            craneType: 3,
            accessory: 'twinlift',
            notifications: 1
        },
        {
            id: 'P450001',
            name: 'Portique P450001',
            categoryId: 'portique',
            terminalId: 'terminal-1',
            status: 'maintenance',
            craneType: 1,
            accessory: 'spreader',
            notifications: 5
        },
        {
            id: 'C220001',
            name: 'Chariot C220001',
            categoryId: 'chariot',
            terminalId: 'terminal-2',
            status: 'affected',
            craneType: 2,
            accessory: 'benne',
            notifications: 2
        },
        {
            id: 'RS100001',
            name: 'Reach Stacker RS100001',
            categoryId: 'reachstacker',
            terminalId: 'terminal-3',
            status: 'standby',
            craneType: 3,
            accessory: 'twinlift',
            notifications: 0
        },
    ],
}
