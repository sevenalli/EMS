import {
    Layers,
    Maximize2,
    Minimize2,
    ZoomIn,
    ZoomOut,
    Navigation,
    Map,
    Satellite,
    Moon
} from 'lucide-react'
import { useMap } from 'react-leaflet'

const MAP_STYLES = {
    street: { icon: Map, label: 'Street' },
    satellite: { icon: Satellite, label: 'Satellite' },
    dark: { icon: Moon, label: 'Dark' }
}

export default function MapControls({
    mapStyle,
    onStyleChange,
    isFullscreen,
    onToggleFullscreen,
    isDarkMode
}) {
    const map = useMap()

    const handleZoomIn = () => map.zoomIn()
    const handleZoomOut = () => map.zoomOut()
    const handleLocate = () => {
        map.flyTo([33.60684488635452, -7.599297046208311], 16, {
            duration: 1.5
        })
    }

    const buttonClass = `
        p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center
        ${isDarkMode
            ? 'bg-gray-900/90 hover:bg-gray-800 text-white border border-white/10 shadow-xl'
            : 'bg-white hover:bg-gray-50 text-gray-700 shadow-lg hover:shadow-xl border border-gray-100'
        }
    `

    const activeButtonClass = `
        p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center
        bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30
    `

    return (
        <>
            {/* Top Right - Layer Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                {/* Style Switcher */}
                <div className={`
                    flex rounded-xl overflow-hidden
                    ${isDarkMode
                        ? 'bg-gray-900/90 border border-white/10 shadow-xl'
                        : 'bg-white shadow-lg border border-gray-100'
                    }
                `}>
                    {Object.entries(MAP_STYLES).map(([key, { icon: Icon, label }]) => (
                        <button
                            key={key}
                            onClick={() => onStyleChange(key)}
                            className={`
                                p-2.5 flex items-center gap-2 transition-all duration-200
                                ${mapStyle === key
                                    ? 'bg-blue-500 text-white'
                                    : isDarkMode
                                        ? 'text-gray-400 hover:text-white hover:bg-white/10'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }
                            `}
                            title={label}
                        >
                            <Icon size={18} />
                            <span className="text-xs font-medium hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Fullscreen */}
                <button
                    onClick={onToggleFullscreen}
                    className={buttonClass}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
            </div>

            {/* Bottom Right - Zoom Controls */}
            <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={handleLocate}
                    className={buttonClass}
                    title="Center on Port"
                >
                    <Navigation size={18} />
                </button>

                <div className={`
                    flex flex-col rounded-xl overflow-hidden
                    ${isDarkMode
                        ? 'bg-gray-900/90 border border-white/10 shadow-xl'
                        : 'bg-white shadow-lg border border-gray-100'
                    }
                `}>
                    <button
                        onClick={handleZoomIn}
                        className={`
                            p-2.5 transition-all duration-200
                            ${isDarkMode
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-700 hover:bg-gray-100'
                            }
                        `}
                        title="Zoom In"
                    >
                        <ZoomIn size={18} />
                    </button>
                    <div className={`h-px ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`} />
                    <button
                        onClick={handleZoomOut}
                        className={`
                            p-2.5 transition-all duration-200
                            ${isDarkMode
                                ? 'text-white hover:bg-white/10'
                                : 'text-gray-700 hover:bg-gray-100'
                            }
                        `}
                        title="Zoom Out"
                    >
                        <ZoomOut size={18} />
                    </button>
                </div>
            </div>
        </>
    )
}
