import React, { useMemo } from 'react';
import { useStore } from '../store/store';

/**
 * Semi-circular gauge with industrial styling, tick marks, and colored thresholds.
 */
function SemiGauge({
    value = 50,
    min = 0,
    max = 100,
    size = 160,
    unit = '%',
    title = '',
    thresholds = { warning: 75, danger: 90 }
}) {
    const isDarkMode = useStore((state) => state.isDarkMode)

    // Clamp value
    const safeValue = Math.min(Math.max(value, min), max)
    const range = max - min
    const percentage = ((safeValue - min) / range) * 100

    // Geometry
    const strokeWidth = size * 0.12
    const radius = size * 0.4
    const center = size / 2
    const startAngle = -135
    const endAngle = 135
    const totalAngle = endAngle - startAngle

    // Colors based on value
    const getValueColor = (val) => {
        if (val >= thresholds.danger) return '#ef4444' // Red
        if (val >= thresholds.warning) return '#f97316' // Orange
        return '#22c55e' // Green
    }

    const activeColor = getValueColor(safeValue)

    // Helper: Polar to Cartesian
    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        }
    }

    // Helper: SVG Path for Arc
    const describeArc = (x, y, radius, startAngle, endAngle) => {
        const start = polarToCartesian(x, y, radius, endAngle)
        const end = polarToCartesian(x, y, radius, startAngle)
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ")
    }

    // Threshold Segments (Background Track)
    const trackSegments = useMemo(() => {
        // Defines zones: 0 -> warning -> danger -> 100
        // Convert thresholds to angles based on min/max range
        const range = max - min

        // Clamp thresholds to min/max to avoid drawing errors
        const safeWarning = Math.max(min, Math.min(max, thresholds.warning))
        const safeDanger = Math.max(min, Math.min(max, thresholds.danger))

        const warningAngle = startAngle + ((safeWarning - min) / range) * totalAngle
        const dangerAngle = startAngle + ((safeDanger - min) / range) * totalAngle

        return [
            { start: startAngle, end: warningAngle, color: '#22c55e' }, // Green Zone
            { start: warningAngle, end: dangerAngle, color: '#f97316' }, // Warning Zone
            { start: dangerAngle, end: endAngle, color: '#ef4444' }    // Danger Zone
        ]
    }, [startAngle, endAngle, totalAngle, thresholds, min, max])

    // Generate Ticks
    const ticks = useMemo(() => {
        const tickArray = []
        const majorTicks = 5
        const minorTicks = 4 // between majors
        const totalTicks = majorTicks * (minorTicks + 1)

        for (let i = 0; i <= totalTicks; i++) {
            const ratio = i / totalTicks
            const angle = startAngle + (ratio * totalAngle)
            const isMajor = i % (minorTicks + 1) === 0

            const outerR = radius - strokeWidth / 2 - 2
            const length = isMajor ? size * 0.08 : size * 0.04
            const innerR = outerR - length

            const start = polarToCartesian(center, center, outerR, angle)
            const end = polarToCartesian(center, center, innerR, angle)

            tickArray.push({
                x1: start.x, y1: start.y,
                x2: end.x, y2: end.y,
                isMajor,
                value: min + (ratio * range)
            })
        }
        return tickArray
    }, [size, radius, strokeWidth, center, min, range, startAngle, totalAngle])

    // Needle Angle
    const angle = startAngle + (percentage / 100) * totalAngle
    const needleTip = polarToCartesian(center, center, radius - 5, angle)
    const needleBaseL = polarToCartesian(center, center, 4, angle - 90)
    const needleBaseR = polarToCartesian(center, center, 4, angle + 90)

    return (
        <div className="flex flex-col items-center">
            {/* Title */}
            {title && (
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {title}
                </div>
            )}

            <div style={{ width: size, height: size * 0.8 }} className="relative">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        {/* Needle Shadow */}
                        <filter id="dropShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
                            <feOffset dx="1" dy="1" result="offsetblur" />
                            <feComponentTransfer>
                                <feFuncA type="linear" slope="0.3" />
                            </feComponentTransfer>
                            <feMerge>
                                <feMergeNode />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Track Background Segments */}
                    {trackSegments.map((seg, i) => (
                        <path
                            key={i}
                            d={describeArc(center, center, radius, seg.start, seg.end)}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="butt"
                            strokeOpacity={isDarkMode ? 0.2 : 0.15}
                        />
                    ))}

                    {/* Gap Fill (Optional Background for whole track if needed) -> Skipped for clean segmented look */}

                    {/* Active Arc */}
                    <path
                        d={describeArc(center, center, radius, startAngle, angle)}
                        fill="none"
                        stroke={activeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />

                    {/* Ticks */}
                    {ticks.map((tick, i) => (
                        <g key={i}>
                            <line
                                x1={tick.x1}
                                y1={tick.y1}
                                x2={tick.x2}
                                y2={tick.y2}
                                stroke={isDarkMode ? (tick.isMajor ? '#9ca3af' : '#4b5563') : (tick.isMajor ? '#6b7280' : '#d1d5db')}
                                strokeWidth={tick.isMajor ? 2 : 1}
                            />
                            {/* Major Tick Labels */}
                            {tick.isMajor && (
                                <text
                                    x={polarToCartesian(center, center, radius + 15, startAngle + (i / (ticks.length - 1)) * totalAngle).x}
                                    y={polarToCartesian(center, center, radius + 15, startAngle + (i / (ticks.length - 1)) * totalAngle).y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className={`text-[9px] font-mono ${isDarkMode ? 'fill-gray-500' : 'fill-gray-400'}`}
                                    style={{ fontSize: size * 0.07 }}
                                >
                                    {Math.round(tick.value)}
                                </text>
                            )}
                        </g>
                    ))}

                    {/* Needle */}
                    <path
                        d={`M ${needleBaseL.x} ${needleBaseL.y} L ${needleTip.x} ${needleTip.y} L ${needleBaseR.x} ${needleBaseR.y} Z`}
                        fill={isDarkMode ? '#ef4444' : '#dc2626'}
                        filter="url(#dropShadow)"
                    />

                    {/* Center Pivot */}
                    <circle cx={center} cy={center} r={6} fill={isDarkMode ? '#e5e7eb' : '#1f2937'} strokeWidth="2" stroke={isDarkMode ? '#1f2937' : '#fff'} />
                    <circle cx={center} cy={center} r={2} fill={isDarkMode ? '#1f2937' : '#e5e7eb'} />

                </svg>

                {/* Digital Readout - Positioned Absolute Bottom */}
                <div className="absolute inset-x-0 bottom-0 top-[60%] flex flex-col items-center justify-start">
                    <span
                        className={`text-3xl font-bold font-mono tracking-tighter leading-none ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}
                        style={{ color: activeColor }}
                    >
                        {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                    <span className={`text-xs font-bold uppercase mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {unit}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default SemiGauge;
