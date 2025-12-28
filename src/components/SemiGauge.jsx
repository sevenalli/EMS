import React from 'react';

/**
 * Semi-circular gauge with colored segments and needle pointer
 * Green → Lime → Yellow → Orange → Red
 */
function SemiGauge({
    value = 50,
    min = 0,
    max = 100,
    size = 140,
    showLabels = true,
    unit = '%',
    title = ''
}) {
    // Normalize value to 0-100 range
    const normalizedValue = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    // Calculate needle angle (from -135deg to +135deg, total 270deg arc)
    const needleAngle = -135 + (normalizedValue / 100) * 270;

    // SVG parameters
    const strokeWidth = size * 0.14;
    const radius = (size / 2) - strokeWidth - 5;
    const center = size / 2;

    // Create arc path for each segment
    const createArc = (startPercent, endPercent) => {
        const startAngle = -225 + (startPercent / 100) * 270;
        const endAngle = -225 + (endPercent / 100) * 270;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);

        const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
    };

    // Segment colors
    const segments = [
        { start: 0, end: 20, color: '#22c55e' },      // Green
        { start: 20, end: 40, color: '#84cc16' },     // Lime
        { start: 40, end: 60, color: '#eab308' },     // Yellow
        { start: 60, end: 80, color: '#f97316' },     // Orange
        { start: 80, end: 100, color: '#ef4444' },    // Red
    ];

    // Label positions - fewer for clarity
    const labelPositions = showLabels ? [0, 40, 60, 100] : [];

    const getLabelPosition = (percent) => {
        const angle = -225 + (percent / 100) * 270;
        const labelRadius = radius + strokeWidth / 2 + 14;
        const rad = (angle * Math.PI) / 180;
        return {
            x: center + labelRadius * Math.cos(rad),
            y: center + labelRadius * Math.sin(rad)
        };
    };

    // Needle position
    const needleRad = ((-225 + (normalizedValue / 100) * 270) * Math.PI) / 180;
    const needleLength = radius - 8;

    return (
        <div className="flex flex-col items-center gap-1">
            {title && (
                <div className="text-[11px] font-medium text-gray-300 uppercase tracking-wider text-center">{title}</div>
            )}
            <div className="relative" style={{ width: size, height: size * 0.72 }}>
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    style={{ marginTop: -size * 0.1 }}
                >
                    {/* Colored segments */}
                    {segments.map((segment, idx) => (
                        <path
                            key={idx}
                            d={createArc(segment.start, segment.end)}
                            fill="none"
                            stroke={segment.color}
                            strokeWidth={strokeWidth}
                            strokeLinecap="butt"
                        />
                    ))}

                    {/* Labels */}
                    {labelPositions.map((percent) => {
                        const pos = getLabelPosition(percent);
                        return (
                            <text
                                key={percent}
                                x={pos.x}
                                y={pos.y}
                                fill="#9ca3af"
                                fontSize="11"
                                fontWeight="500"
                                fontFamily="system-ui, -apple-system, sans-serif"
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                {percent}%
                            </text>
                        );
                    })}

                    {/* Needle */}
                    <line
                        x1={center}
                        y1={center}
                        x2={center + needleLength * Math.cos(needleRad)}
                        y2={center + needleLength * Math.sin(needleRad)}
                        stroke="#4b5563"
                        strokeWidth={5}
                        strokeLinecap="round"
                    />

                    {/* Center cap */}
                    <circle
                        cx={center}
                        cy={center}
                        r={size * 0.06}
                        fill="#374151"
                    />
                </svg>

                {/* Digital value display */}
                <div
                    className="absolute left-1/2 transform -translate-x-1/2 text-center"
                    style={{ bottom: 2 }}
                >
                    <span className="text-xl font-bold text-white" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                        {typeof value === 'number' ? Math.round(value) : value}
                    </span>
                    <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
                </div>
            </div>
        </div>
    );
}

export default SemiGauge;
