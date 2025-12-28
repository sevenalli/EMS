# Project Context for AI Assistants

## Project Overview
**Application**: Port Crane Monitoring System (EMS)
**Tech Stack**: React, Vite, TailwindCSS, Node.js, Socket.io
**Purpose**: Real-time and historical monitoring of industrial harbor cranes (Gottwald/Terex models).

## Core Application Logic

### Main Dashboard Component: `src/pages/EquipmentMonitoring.jsx`
- **State Management**: Handles 3 modes (`live`, `history`, `simulation`) and 2 scenarios (`bulk`, `container`).
- **Visualization**:
  - **Side View**: SVG/Image-based digital twin. uses CSS transforms (`rotate`, `scaleX`, `height`) updated via state variables (`luffAngle`, `slewScaleX`, `ropeLength`).
  - **Assets**: Heavily relies on images in `/public`: `crane-base.png`, `crane-tower.png`, `crane-boom.png`, `vessel.png`, `vessel-container.jpg`, `spreader-container.png`, etc.
- **Simulation**: Contains `generateSimulationData()` function that creates physics-based mock telemetry.

### Backend: `server/index.js`
- **Socket.io**: Emits `crane_telemetry` events.
- **API**: `/api/history/:equipmentId` endpoint for fetching historical data.

### Key Data Structures
**Telemetry Object**:
```json
{
  "timestamp": "ISO-8601",
  "data": {
    "Spreader_Verrouillage_OK": 1,
    "Poids_de_la_charge_en_t": 25.5,
    "Hauteur_de_levage_en_m": 15.2,
    "Portee_en_m": 32.0,
    "Angle_de_rotation_en_d": 180.5,
    "Vitesse_Vent_en_kmh": 12
  }
}
```

## Critical Files Map
1. `src/pages/EquipmentMonitoring.jsx` - **PRIMARY**. Contains Visuals, Simulation Logic, and UI.
2. `src/hooks/useHistory.js` - Data fetching logic.
3. `src/data/telemetryData.js` - Constants and Mock definitions.
4. `src/App.jsx` - Routing and Layout.

## Style Guide
- **TailwindCSS**: Used for all styling.
- **Dark Mode**: Supported via `isDarkMode` store state.
- **Responsiveness**: Flexbox/Grid layouts.

## Recent Changes
- Added **Container Scenario**: Swaps vessel and spreader images.
- Added **Simulation Mode**: Generates smooth sine-wave based movements.
- Fixed **Z-Index Layering**: Crane container (`z-60`) sits above Vessel (`z-50`).
