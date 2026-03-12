import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Dashboard Configuration Store
 * Manages widget layout, visibility, and user preferences
 */

// Default category order
const DEFAULT_CATEGORY_ORDER = [
    'loadSafety',
    'speedMotion',
    'engineEnergy',
    'electrical',
    'temperatures',
    'hydraulics',
    'loadMechanics',
    'position',
    'maintenance',
    'status'
]

// Create dashboard config store
export const useDashboardConfig = create(
    persist(
        (set, get) => ({
            // Category visibility and order
            categoryOrder: [...DEFAULT_CATEGORY_ORDER],
            hiddenCategories: [],

            // Reorder categories
            reorderCategories: (fromIndex, toIndex) => {
                set((state) => {
                    const newOrder = [...state.categoryOrder]
                    const [removed] = newOrder.splice(fromIndex, 1)
                    newOrder.splice(toIndex, 0, removed)
                    return { categoryOrder: newOrder }
                })
            },

            // Move category up
            moveCategoryUp: (categoryId) => {
                set((state) => {
                    const index = state.categoryOrder.indexOf(categoryId)
                    if (index <= 0) return state
                    const newOrder = [...state.categoryOrder]
                        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
                    return { categoryOrder: newOrder }
                })
            },

            // Move category down
            moveCategoryDown: (categoryId) => {
                set((state) => {
                    const index = state.categoryOrder.indexOf(categoryId)
                    if (index < 0 || index >= state.categoryOrder.length - 1) return state
                    const newOrder = [...state.categoryOrder]
                        ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
                    return { categoryOrder: newOrder }
                })
            },

            // Toggle category visibility
            toggleCategory: (categoryId) => {
                set((state) => {
                    const hidden = new Set(state.hiddenCategories)
                    if (hidden.has(categoryId)) {
                        hidden.delete(categoryId)
                    } else {
                        hidden.add(categoryId)
                    }
                    return { hiddenCategories: Array.from(hidden) }
                })
            },

            // Show all categories
            showAllCategories: () => {
                set({ hiddenCategories: [] })
            },

            // Get visible categories in order
            getVisibleCategories: () => {
                const { categoryOrder, hiddenCategories } = get()
                return categoryOrder.filter(c => !hiddenCategories.includes(c))
            },

            // Check if category is visible
            isCategoryVisible: (categoryId) => {
                return !get().hiddenCategories.includes(categoryId)
            },

            // Reset to defaults
            resetLayout: () => {
                set({
                    categoryOrder: [...DEFAULT_CATEGORY_ORDER],
                    hiddenCategories: []
                })
            },

            // Widget-level customization (for future)
            widgetSettings: {},
            updateWidgetSetting: (categoryId, widgetKey, settings) => {
                set((state) => ({
                    widgetSettings: {
                        ...state.widgetSettings,
                        [`${categoryId}.${widgetKey}`]: {
                            ...state.widgetSettings[`${categoryId}.${widgetKey}`],
                            ...settings
                        }
                    }
                }))
            }
        }),
        {
            name: 'ems-dashboard-config',
            version: 1
        }
    )
)

export default useDashboardConfig
