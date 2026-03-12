# Equipment Monitoring System (EMS) 🏗️🚢

A comprehensive real-time monitoring and historical analysis dashboard for industrial port equipment (cranes, elevators, mobile equipment), featuring live MQTT telemetry, historical data playback, export capabilities, and internationalization support.

## 🌟 Key Features Overview

### ✅ **Fully Implemented Features**

#### 1. **Real-time Live Monitoring**
- MQTT WebSocket connection for live telemetry streaming
- Dynamic equipment-specific tag mapping from CSV files
- Real-time gauge displays, status indicators, and numeric readouts
- Connection status monitoring and error handling
- Support for both dynamic-tag equipment and generic equipment types

#### 2. **Three Operation Modes**
- **Live Mode**: Real-time MQTT data stream with equipment-specific parameters
- **History Mode**: Playback of historical telemetry data with time controls
- **Simulation Mode**: Physics-based crane movement simulation (in-progress)

#### 3. **Data Export (NEW)**
- **PDF Export**: Landscape-oriented telemetry snapshots with Parameter/Value/Unit columns
  - Text wrapping for long parameter names
  - Alternating row colors for readability
  - Automatic page breaks for large datasets
  - Custom header styling and page numbering

- **Excel Export (.xlsx)**: Structured spreadsheet export with auto-sized columns
  - Uses SheetJS (XLSX) for reliable Excel generation
  - Preserves data types (numbers, booleans, dates)
  - Clean formatting with configurable column widths

- **CSV Export**: Standard comma-separated values format
  - Proper CSV escaping for special characters
  - Support for custom column selection
  - Timestamp-based filename generation

**Usage**: Click the "Export" button in the TelemetryDashboard header and select desired format.

#### 4. **Historical Data Playback**
- Load historical telemetry data for any equipment
- Playback controls: Play/Pause, Speed control (0.5x, 1x, 2x, 4x)
- Timeline slider for seeking through history
- Time range selection (1h, 4h, 24h, 7d)
- Real-time playback progress tracking

#### 5. **Equipment Management**
- Equipment selection interface with visual icons for different equipment types
- Dynamic tag loading from CSV mapping files
- Function group filtering for equipment with multiple functional areas
- Breadcrumb navigation for easy navigation

#### 6. **Dashboard & Visualization**
- Dark mode support with persistent theme preference
- Responsive layout that works on desktop and tablets
- Real-time digital gauges (semi-circular gauge component)
- Equipment-specific status indicators
- Live connection status display

#### 7. **Internationalization (i18n)**
- Support for multiple languages via i18next
- Language switcher in common components
- Localized UI labels and messages
- English and French language files included

#### 8. **Notifications System**
- Real-time alert notifications for equipment issues
- Notification history with filtering options
- Unread notification tracking
- Persistent notification display

#### 9. **MQTT Integration**
- WebSocket-based MQTT client for HiveMQ broker connectivity
- Dynamic topic subscription based on equipment ID
- Graceful reconnection handling
- Error state management
- Broker URL configuration via settings modal

### 🚀 **In-Progress Features**

#### 1. **Advanced Map View**
- Interactive map component with equipment location markers
- Map controls and sidebar for filtering
- Integration with Leaflet.js
- Status: Scaffolding complete, functionality being developed

#### 2. **Simulation/Physics Engine**
- Physics-based crane movement simulation
- Playback speed control for simulation
- Support for testing equipment behavior
- Status: Framework in place, physics calculations pending

#### 3. **Admin & Equipment Inventory Management**
- Equipment admin interface with import/export capabilities
- Equipment database management
- Batch import from CSV
- Status: UI components created, backend integration pending

#### 4. **Advanced Playback Features**
- Extended playback controls and visualization
- Multiple playback speed options
- Frame-by-frame advancement
- Status: Hook created, additional UI refinement pending

#### 5. **Dashboard Customization**
- User-configurable dashboard widget layouts
- Save/load custom dashboard configurations
- Widget visibility toggles
- Status: Configuration hook created, persistent storage pending

### ⚠️ **Partial/Legacy Features**

#### 1. **Simulation Mode**
- Current state: Equipment displays but physics simulation incomplete
- Mock data generator exists for testing
- Scenario switching infrastructure in place (Bulk vs Container)
- Status: UI works, actual physics calculations not implemented

#### 2. **Radar/Top-down View**
- Infrastructure present in telemetry data structure
- UI components scaffolded
- Status: Data structure ready, visualization not fully implemented

### ❌ **Not Yet Implemented**

1. **Advanced Analytics**
   - Historical trend analysis
   - Equipment performance metrics
   - Predictive maintenance algorithms
   - Data aggregation and reporting

2. **User Authentication & Authorization**
   - User login system
   - Role-based access control
   - User permissions management

3. **Alert Configuration**
   - Threshold-based alerting rules
   - Custom alert settings per equipment
   - Alert routing and escalation

4. **Mobile-First UI**
   - Touch-optimized controls
   - Mobile-specific layouts
   - Responsive chart scaling

5. **Data Persistence Layer**
   - Persistent notification storage
   - Equipment configuration database
   - User preferences storage (partially via browser localStorage)

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 6.0.6 | Build tool & dev server |
| TailwindCSS | 3.4.17 | Styling |
| React Router | 7.1.1 | Client-side routing |
| Zustand | 5.0.2 | State management |
| Lucide React | 0.468.0 | Icon library |
| i18next | 25.8.0 | Internationalization |

### Data & Export
| Technology | Version | Purpose |
|---|---|---|
| MQTT.js | 5.10.3 | MQTT client for real-time data |
| jsPDF | 4.0.0 | PDF generation |
| jsPDF-autoTable | 5.0.7 | PDF table formatting |
| XLSX (SheetJS) | 0.18.5 | Excel file generation |
| PapaParse | 5.5.3 | CSV parsing |

### Maps & Visualization
| Technology | Version | Purpose |
|---|---|---|
| Leaflet | 1.9.4 | Interactive mapping |
| React Leaflet | 4.2.1 | React wrapper for Leaflet |

### Testing & Development
| Technology | Version | Purpose |
|---|---|---|
| Vitest | 4.0.18 | Unit testing framework |
| Testing Library React | 16.3.2 | React component testing |
| jsdom | 27.4.0 | DOM implementation for tests |
| ESLint | 9.17.0 | Code linting |
| Autoprefixer | 10.4.20 | CSS vendor prefixes |
| PostCSS | 8.4.49 | CSS processing |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16 or higher
- npm or yarn package manager
- MQTT broker (HiveMQ or similar) for live data
- Equipment mapping CSV files for dynamic tag setup

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sevenalli/EMS.git
   cd EMS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up MQTT broker connection:**
   - Default broker: `ws://localhost:8000/mqtt`
   - Configure in TelemetryDashboard via Settings modal
   - Or update in environment variables

4. **Place equipment mapping files:**
   - Add CSV files to `mapping-files/` directory
   - Format: `{equipmentId}.csv`
   - Required columns: `tag_id`, `description`, `unit`, `function_name`

### Running the Application

**Development mode:**
```bash
npm run dev
```
Opens at `http://localhost:5173`

**Production build:**
```bash
npm run build
npm run preview
```

**Run tests:**
```bash
npm test                    # Run tests in watch mode
npm run test:coverage       # Generate coverage report
```

**Lint code:**
```bash
npm run lint
```

---

## 📂 Project Structure

```
EMS/
├── src/
│   ├── pages/
│   │   ├── TelemetryDashboard.jsx      # Main telemetry monitoring dashboard
│   │   ├── EquipmentMonitoring.jsx     # Legacy monitoring page
│   │   ├── EquipmentSelection.jsx      # Equipment picker interface
│   │   ├── Home.jsx                    # Landing page
│   │   ├── Notifications.jsx           # Notification history view
│   │   ├── Dashboard.jsx               # General dashboard (in-progress)
│   │   ├── MapView.jsx                 # Map-based equipment view (in-progress)
│   │   └── AdminInventory.jsx          # Admin equipment management (in-progress)
│   │
│   ├── components/
│   │   ├── telemetry/
│   │   │   └── TelemetryWidgets.jsx   # Gauge & indicator widgets
│   │   ├── map/
│   │   │   ├── CraneMarker.jsx        # Map marker component
│   │   │   ├── MapControls.jsx        # Map control UI
│   │   │   └── MapSidebar.jsx         # Map sidebar filters
│   │   ├── dashboard/
│   │   │   ├── DashboardCustomizer.jsx # Layout customizer (in-progress)
│   │   │   ├── ServiceCard.jsx        # Equipment service card
│   │   │   └── LiveClock.jsx          # Real-time clock display
│   │   ├── playback/
│   │   │   └── PlaybackBar.jsx        # History playback controls
│   │   ├── admin/
│   │   │   ├── EditModal.jsx          # Edit equipment modal
│   │   │   └── ImportModal.jsx        # CSV import modal
│   │   ├── common/
│   │   │   ├── LanguageSwitcher.jsx   # i18n language selector
│   │   │   ├── LoadingSkeleton.jsx    # Loading placeholder
│   │   │   └── ErrorBoundary.jsx      # Error boundary wrapper
│   │   ├── Header.jsx                  # Main navigation header
│   │   ├── EquipmentCard.jsx          # Equipment list card
│   │   ├── SemiGauge.jsx              # Semi-circular gauge component
│   │   └── Others...                   # Various UI components
│   │
│   ├── hooks/
│   │   ├── useMqtt.js                 # MQTT connection & live data hook
│   │   ├── useHistory.js              # Historical data fetching hook
│   │   ├── useTopicDiscovery.js       # MQTT topic discovery
│   │   ├── useGlobalMqtt.js           # Global MQTT state management
│   │   ├── useDashboardConfig.js      # Dashboard configuration
│   │   ├── usePlayback.js             # Playback state management
│   │   └── __tests__/                 # Hook tests
│   │
│   ├── utils/
│   │   ├── exportUtils.js             # Export functions (PDF, Excel, CSV)
│   │   ├── audioNotifications.js      # Audio alert system
│   │   └── __tests__/                 # Utility tests
│   │
│   ├── services/
│   │   └── equipmentAdmin.js          # Equipment admin API calls
│   │
│   ├── context/
│   │   └── MqttContext.jsx            # MQTT context provider
│   │
│   ├── data/
│   │   └── telemetryData.js           # Mock data & configuration constants
│   │
│   ├── i18n/
│   │   └── index.js                   # i18next configuration
│   │
│   ├── App.jsx                         # Main app component & routing
│   ├── main.jsx                        # Entry point
│   ├── index.css                       # Global styles
│   └── setupTests.js                   # Test configuration
│
├── public/
│   ├── chassis.svg                     # Crane visualization assets
│   ├── favicon.png                     # Site favicon
│   ├── equipement_icons/               # Equipment category icons
│   └── Other assets...
│
├── mapping-files/
│   ├── MM1GM11701.csv                 # Example equipment tag mapping
│   ├── MM1GM11702.csv
│   ├── M996002.csv
│   └── Other mappings...
│
├── docker-compose.yml                  # Docker services configuration
├── Dockerfile                          # Application container image
├── nginx.conf                          # Nginx reverse proxy config
├── vite.config.js                      # Vite configuration
├── vitest.config.js                    # Vitest configuration
├── package.json                        # Dependencies & scripts
└── README.md                           # This file
```

---

## 🎮 Usage Guide

### Selecting Equipment
1. **Home Page**: Click on an equipment card to select it
2. **Navigation**: Equipment ID is shown in the breadcrumb
3. **Monitoring**: View real-time telemetry in TelemetryDashboard

### Live Monitoring
1. **Mode**: Toggle "LIVE" in the header (default mode)
2. **Real-time Data**: MQTT telemetry updates automatically
3. **Settings**: Click settings icon to configure MQTT broker URL
4. **Status**: Green indicator = Connected, Red = Disconnected

### Playback & History
1. **Mode**: Click "HISTORY" button in header
2. **Time Range**: Select from dropdown (1h, 4h, 24h, 7d)
3. **Playback Controls**:
   - **Play/Pause**: Start/stop playback
   - **Speed**: 0.5x, 1x, 2x, 4x options
   - **Slider**: Seek to specific time
   - **Skip**: Jump to next/previous frame

### Exporting Data
1. **Live Data**: Click "Export" button (top-right of TelemetryDashboard)
2. **Select Format**: Choose PDF, Excel, or CSV
3. **File Download**: Browser automatically downloads the file
   - **PDF**: Landscape format with formatted table
   - **Excel**: `.xlsx` file with proper columns and widths
   - **CSV**: Standard comma-separated format

### Function Groups (Dynamic Equipment)
- Some equipment has multiple functional areas (function groups)
- Select a specific group to filter displayed parameters
- Export will include only selected group's parameters

### Dark Mode
- Toggle dark mode in the header
- Preference is saved to browser localStorage
- All UI respects the selected theme

### Notifications
1. **View**: Click bell icon or navigate to Notifications page
2. **History**: All notifications displayed with timestamp
3. **Filtering**: Filter by type, category, or status
4. **Export**: Export notification history to PDF/CSV

---

## 📊 Feature Status Matrix

| Feature | Status | Completeness | Notes |
|---------|--------|--------------|-------|
| **Real-time MQTT** | ✅ Complete | 100% | Full WebSocket MQTT integration |
| **Live Dashboard** | ✅ Complete | 100% | Real-time gauges & status display |
| **Historical Playback** | ✅ Complete | 95% | Full controls, minor UX refinements needed |
| **Export (PDF/Excel/CSV)** | ✅ Complete | 100% | All three formats working, tested |
| **Equipment Selection** | ✅ Complete | 100% | Dynamic tag loading from CSV |
| **Notifications** | ✅ Complete | 85% | History tracking, threshold alerts pending |
| **Dark Mode** | ✅ Complete | 100% | Full theme support |
| **i18n Support** | ✅ Complete | 60% | Framework in place, all UI not translated |
| **Map View** | 🔄 In-Progress | 40% | UI scaffolded, visualization pending |
| **Simulation Mode** | 🔄 In-Progress | 30% | Framework present, physics pending |
| **Admin Inventory** | 🔄 In-Progress | 35% | UI complete, backend pending |
| **Dashboard Customization** | 🔄 In-Progress | 25% | Hook created, persistence pending |
| **Advanced Analytics** | ❌ Not Started | 0% | Trend analysis, metrics planned |
| **User Authentication** | ❌ Not Started | 0% | Login system not implemented |
| **Alert Thresholds** | ❌ Not Started | 0% | Custom alert rules pending |

---

## 🔧 Configuration

### MQTT Broker Setup
```javascript
// Default settings in TelemetryDashboard.jsx
const [brokerUrl, setBrokerUrl] = useState('ws://localhost:8000/mqtt')
```

**To change broker:**
1. Open TelemetryDashboard
2. Click Settings (gear icon)
3. Enter new MQTT broker WebSocket URL
4. Settings auto-save

### Equipment Tag Mapping
Place CSV files in `mapping-files/` directory with this structure:

```csv
tag_id,description,unit,function_name
charge_nette,"Net Charge Weight",kg,"Main Hoist"
diesel_en_marche,"Diesel Engine Running",bool,"Engine"
hook_height,"Hook Height",m,"Main Hoist"
boom_angle,"Boom Angle",degrees,"Boom Control"
```

**Dynamic loading:**
- File name must match equipment ID (e.g., `MM1GM11701.csv`)
- Tags from CSV automatically populate the dashboard
- Tags are grouped by `function_name` for filtering

---

## 📦 Dependencies Overview

### Runtime Dependencies
- **react** (18.3.1): UI framework
- **react-router-dom** (7.1.1): Client routing
- **zustand** (5.0.2): Lightweight state management
- **mqtt** (5.10.3): MQTT client
- **jspdf** (4.0.0) + **jspdf-autotable** (5.0.7): PDF generation
- **xlsx** (0.18.5): Excel export support
- **leaflet** (1.9.4) + **react-leaflet** (4.2.1): Maps
- **i18next** + **react-i18next** (25.8.0, 16.5.4): Internationalization
- **lucide-react** (0.468.0): 1500+ icons

### Development Dependencies
- **vite** (6.0.6): Build tool
- **tailwindcss** (3.4.17): CSS framework
- **vitest** (4.0.18): Unit testing
- **@testing-library/react** (16.3.2): Component testing
- **eslint** (9.17.0): Linting

---

## 🐳 Docker Support

### Build Docker Image
```bash
docker build -t ems:latest .
```

### Run with Docker Compose
```bash
docker-compose up
```

Services:
- **Frontend**: http://localhost:3000
- **MQTT Broker**: localhost:8883 (configured in docker-compose)
- **Nginx Proxy**: Handles routing between services

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test exportUtils
```

### Generate Coverage Report
```bash
npm run test:coverage
```

Test files:
- `src/utils/__tests__/exportUtils.test.js` - Export functionality tests
- `src/hooks/__tests__/usePlayback.test.js` - Playback hook tests

---

## 📝 Recent Updates (Latest Commit)

### v1.1.0 - Data Export Feature (Latest)
- ✨ **Added PDF Export**: Landscape telemetry snapshots with Parameter/Value/Unit layout
- ✨ **Added Excel Export**: XLSX format with auto-sized columns and proper data types
- ✨ **Added CSV Export**: Improved CSV generation with better escaping
- 🐛 **Fixed**: jsPDF import statement for proper plugin integration
- 📦 **Dependency**: Installed `xlsx` (0.18.5) for Excel support
- 🎨 **UI**: Export button with dropdown menu in TelemetryDashboard header
- 📋 **Smart Columns**: Automatic column selection based on equipment type and function groups

### v1.0.1 - MQTT WebSocket Integration
- Fixed MQTT WebSocket connectivity for HiveMQ broker
- Improved error handling and reconnection logic
- Added theme toggle and notification improvements

### v1.0.0 - Initial Release
- Core monitoring dashboard with real-time telemetry
- Historical data playback with time controls
- Multi-format support (PDF, Excel, CSV)
- Dark mode and internationalization

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit a pull request with detailed description

---

## 📞 Support & Documentation

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Feature requests in GitHub Discussions
- **Configuration**: See inline JSDoc comments in hook files
- **API Docs**: Component prop documentation in JSDoc blocks

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎯 Future Roadmap

### Q2 2026
- [ ] Complete simulation/physics engine
- [ ] Implement advanced analytics dashboard
- [ ] Add user authentication system
- [ ] Enhanced notification threshold configuration

### Q3 2026
- [ ] Mobile-responsive UI improvements
- [ ] Data persistence layer (equipment preferences, custom dashboards)
- [ ] Predictive maintenance algorithms
- [ ] Multi-language translation completion

### Q4 2026
- [ ] Real-time collaborative features
- [ ] Advanced reporting engine
- [ ] API documentation and SDKs
- [ ] Enterprise deployment guides

---

**Last Updated**: 2026-03-12 | **Latest Version**: 1.1.0
