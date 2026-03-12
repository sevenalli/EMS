import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// English translations
const en = {
    translation: {
        // Common
        common: {
            loading: 'Loading...',
            error: 'Error',
            retry: 'Try Again',
            save: 'Save',
            cancel: 'Cancel',
            close: 'Close',
            search: 'Search...',
            noData: 'No data available',
            online: 'Online',
            offline: 'Offline',
            refresh: 'Refresh',
            settings: 'Settings',
            exportCSV: 'Export CSV',
            exportPDF: 'Export PDF',
            allEquipment: 'All Equipment'
        },

        // Navigation
        nav: {
            home: 'Home',
            dashboard: 'Dashboard',
            monitoring: 'Equipment Monitoring',
            telemetry: 'Telemetry',
            notifications: 'Notifications',
            map: 'Map View',
            settings: 'Settings',
            backToPorts: 'Back to Ports'
        },

        // Equipment
        equipment: {
            title: 'Equipment',
            status: 'Status',
            active: 'Active',
            standby: 'Standby',
            on: 'On',
            off: 'Off',
            maintenance: 'Maintenance',
            fuel: 'Fuel',
            load: 'Load',
            wind: 'Wind',
            temperature: 'Temperature',
            hydraulicTemp: 'Hydraulic Temp',
            noEquipment: 'No equipment found',
            site: 'Site',
            terminal: 'Terminal',
            category: 'Category',
            port: 'Port',
            code: 'Code',
            step: 'Step {{n}}',
            selectionTitle: 'Equipment Selection',
            selectionInstruction: 'Select terminal, category, then equipment to supervise',
            autoSelectionEnabled: 'Auto-selection enabled',
            filterHint: 'Filter by terminal and category',
            selectedInfo: 'Selected Equipment Information',
            selectedCount: '{{count}} selected',
            proceed: 'Proceed to Visualization'
        },

        // Playback
        playback: {
            live: 'Live',
            history: 'History',
            play: 'Play',
            pause: 'Pause',
            skipBack: 'Skip Back',
            skipForward: 'Skip Forward',
            speed: 'Speed',
            timeRange: 'Time Range'
        },

        // Notifications
        notifications: {
            title: 'Notifications',
            critical: 'Critical',
            alarm: 'Alarm',
            warning: 'Warning',
            fault: 'Fault',
            info: 'Info',
            allTypes: 'All Types',
            allCategories: 'All Categories',
            activeOnly: 'Active Only',
            markAllRead: 'Mark All Read',
            clearInactive: 'Clear Inactive',
            noNotifications: 'No notifications',
            typeLabel: 'Type:',
            categoryLabel: 'Category:',
            active: 'ACTIVE',
            cleared: 'CLEARED',
            criticalCount: '{{count}} Critical',
            activeCount: '{{count}} Active',
            unreadCount: '{{count}} Unread'
        },

        // Export
        export: {
            title: 'Export',
            csv: 'CSV',
            pdf: 'PDF',
            xlsx: 'Excel',
            exporting: 'Exporting...',
            success: 'Export successful',
            error: 'Export failed'
        },

        // Dashboard
        dashboard: {
            title: 'Dashboard',
            overview: 'Overview',
            selectEquipment: 'Select Equipment',
            equipmentCount: '{{count}} equipment',
            onlineCount: '{{count}} online',
            customize: 'Customize Layout'
        },

        // Telemetry categories
        telemetry: {
            loadSafety: 'Load & Safety',
            speedMotion: 'Speed & Motion',
            engineEnergy: 'Engine & Energy',
            electrical: 'Electrical',
            temperatures: 'Temperatures',
            hydraulics: 'Hydraulics',
            loadMechanics: 'Load Mechanics',
            position: 'Position & Geometry',
            maintenance: 'Maintenance',
            status: 'Operational Status',
            safe: 'SAFE',
            warning: 'WARNING',
            danger: 'DANGER',
            playbackMode: 'Playback',
            loadingHistory: 'Loading history data...',
            dataPoints: '{{count}} data points | Frame {{frame}} of {{total}}',
            loadingTagMap: 'Loading tag map for {{id}}...',
            functionGroups: '{{count}} function groups · select a group to inspect its tags'
        },

        // Monitoring page
        monitoring: {
            title: 'Port Crane Monitoring System',
            simulation: 'Sim',
            selectTime: 'Select time',
            topViewSlewing: 'Top View - Slewing',
            sideViewLuffing: 'Side View - Luffing & Hoisting',
            slewAngle: 'SLEW: {{angle}}°',
            realtime: 'Real-Time Monitoring',
            hoistingSpeed: 'Hoisting Speed',
            slewingAngle: 'Slewing Angle',
            luffingAngle: 'Luffing Angle',
            height: 'Height',
            fullDashboard: 'Full Dashboard',
            luffing: 'Luffing',
            hoisting: 'Hoisting',
            loadStatus: 'Load Status',
            attached: 'Attached',
            detached: 'Detached',
            releaseLoad: 'Release Load',
            attachLoad: 'Attach Load',
            loadSecured: 'Load Secured',
            awaitingLoad: 'Awaiting Load',
            rotateLeft: 'Left',
            rotateRight: 'Right',
            up: 'Up',
            down: 'Down',
            raise: 'Raise',
            lower: 'Lower',
            mainSwitch: 'Main Switch',
            engineTemp: 'Engine Temp',
            locked: 'Locked',
            unlocked: 'Unlocked',
            chargeNette: 'Net Charge',
            hauteurLevage: 'Hoist Height',
            tempHydraulique: 'Hydraulic Temp',
            pressionPompe: 'Pump Pressure',
            freinLevage: 'Hoist Brake',
            freinOrient: 'Slew Brake',
            tensionMoteur: 'Motor Voltage',
            frequence: 'Frequency',
            puissance: 'Power',
            vitesseLevage: 'Hoisting Speed',
            angleOrientation: 'Slewing Angle',
            angleLuffage: 'Luffing Angle'
        },

        // Settings
        settings: {
            mqttBrokerUrl: 'MQTT Broker URL',
            usePi5: 'Use Pi5'
        },

        // Time ranges
        time: {
            '1h': '1 hour',
            '6h': '6 hours',
            '24h': '24 hours',
            '7d': '7 days',
            justNow: 'Just now',
            minutesAgo: '{{count}}m ago',
            hoursAgo: '{{count}}h ago'
        },

        // Home
        home: {
            title: 'BUM Dashboard',
            subtitle: 'Intelligent platform for port operations management',
            start3d: 'Start 3D Real-time',
            monitoring: 'Equipment Monitoring',
            features: 'Core Features',
            comingSoon: 'Coming Soon'
        }
    }
}

// French translations
const fr = {
    translation: {
        // Common
        common: {
            loading: 'Chargement...',
            error: 'Erreur',
            retry: 'Réessayer',
            save: 'Enregistrer',
            cancel: 'Annuler',
            close: 'Fermer',
            search: 'Rechercher...',
            noData: 'Aucune donnée disponible',
            online: 'En ligne',
            offline: 'Hors ligne',
            refresh: 'Actualiser',
            settings: 'Paramètres',
            exportCSV: 'Exporter CSV',
            exportPDF: 'Exporter PDF',
            allEquipment: 'Tous les équipements'
        },

        // Navigation
        nav: {
            home: 'Accueil',
            dashboard: 'Tableau de bord',
            monitoring: 'Surveillance des équipements',
            telemetry: 'Télémétrie',
            notifications: 'Notifications',
            map: 'Vue carte',
            settings: 'Paramètres',
            backToPorts: 'Retour aux ports'
        },

        // Equipment
        equipment: {
            title: 'Équipement',
            status: 'État',
            active: 'Actif',
            standby: 'En attente',
            on: 'Allumé',
            off: 'Éteint',
            maintenance: 'Maintenance',
            fuel: 'Carburant',
            load: 'Charge',
            wind: 'Vent',
            temperature: 'Température',
            hydraulicTemp: 'Temp. hydraulique',
            noEquipment: 'Aucun équipement trouvé',
            site: 'Site',
            terminal: 'Terminal',
            category: 'Catégorie',
            port: 'Port',
            code: 'Code',
            step: 'Étape {{n}}',
            selectionTitle: 'Sélection des Équipements',
            selectionInstruction: 'Sélectionnez le terminal, la catégorie, puis les équipements à superviser',
            autoSelectionEnabled: 'Sélection automatique activée',
            filterHint: 'Filtrez par terminal et catégorie',
            selectedInfo: 'Information sur l\'équipement sélectionné',
            selectedCount: '{{count}} sélectionné(s)',
            proceed: 'Procéder à la visualisation'
        },

        // Playback
        playback: {
            live: 'Direct',
            history: 'Historique',
            play: 'Lecture',
            pause: 'Pause',
            skipBack: 'Retour',
            skipForward: 'Avancer',
            speed: 'Vitesse',
            timeRange: 'Plage horaire'
        },

        // Notifications
        notifications: {
            title: 'Notifications',
            critical: 'Critique',
            alarm: 'Alarme',
            warning: 'Avertissement',
            fault: 'Défaut',
            info: 'Info',
            allTypes: 'Tous les types',
            allCategories: 'Toutes catégories',
            activeOnly: 'Actives uniquement',
            markAllRead: 'Tout marquer lu',
            clearInactive: 'Effacer inactives',
            noNotifications: 'Aucune notification',
            typeLabel: 'Type :',
            categoryLabel: 'Catégorie :',
            active: 'ACTIF',
            cleared: 'RÉSOLU',
            criticalCount: '{{count}} Critique(s)',
            activeCount: '{{count}} Actif(s)',
            unreadCount: '{{count}} Non lu(s)'
        },

        // Export
        export: {
            title: 'Exporter',
            csv: 'CSV',
            pdf: 'PDF',
            xlsx: 'Excel',
            exporting: 'Exportation...',
            success: 'Exportation réussie',
            error: 'Échec de l\'exportation'
        },

        // Dashboard
        dashboard: {
            title: 'Tableau de bord',
            overview: 'Aperçu',
            selectEquipment: 'Sélectionner l\'équipement',
            equipmentCount: '{{count}} équipements',
            onlineCount: '{{count}} en ligne',
            customize: 'Personnaliser la disposition'
        },

        // Telemetry categories
        telemetry: {
            loadSafety: 'Charge & Sécurité',
            speedMotion: 'Vitesse & Mouvement',
            engineEnergy: 'Moteur & Énergie',
            electrical: 'Électrique',
            temperatures: 'Températures',
            hydraulics: 'Hydraulique',
            loadMechanics: 'Mécanique de charge',
            position: 'Position & Géométrie',
            maintenance: 'Maintenance',
            status: 'État opérationnel',
            safe: 'SÛR',
            warning: 'AVERTISSEMENT',
            danger: 'DANGER',
            playbackMode: 'Lecture',
            loadingHistory: 'Chargement des données historiques...',
            dataPoints: '{{count}} points | Image {{frame}} sur {{total}}',
            loadingTagMap: 'Chargement de la carte de tags pour {{id}}...',
            functionGroups: '{{count}} groupes de fonctions · sélectionnez un groupe pour voir ses tags'
        },

        // Monitoring page
        monitoring: {
            title: 'Système de surveillance des grues portuaires',
            simulation: 'Sim',
            selectTime: 'Sélectionner l\'heure',
            topViewSlewing: 'Vue de dessus - Orientation',
            sideViewLuffing: 'Vue de côté - Luffage & Levage',
            slewAngle: 'ORIENT : {{angle}}°',
            realtime: 'Surveillance en temps réel',
            hoistingSpeed: 'Vitesse de levage',
            slewingAngle: 'Angle d\'orientation',
            luffingAngle: 'Angle de luffage',
            height: 'Hauteur',
            fullDashboard: 'Tableau de bord complet',
            luffing: 'Luffage',
            hoisting: 'Levage',
            loadStatus: 'État de la charge',
            attached: 'Attaché',
            detached: 'Détaché',
            releaseLoad: 'Libérer la charge',
            attachLoad: 'Attacher la charge',
            loadSecured: 'Charge sécurisée',
            awaitingLoad: 'En attente de charge',
            rotateLeft: 'Gauche',
            rotateRight: 'Droite',
            up: 'Haut',
            down: 'Bas',
            raise: 'Monter',
            lower: 'Descendre',
            mainSwitch: 'Interrupteur principal',
            engineTemp: 'Temp. Moteur',
            locked: 'Verrouillé',
            unlocked: 'Déverrouillé',
            chargeNette: 'Charge Nette',
            hauteurLevage: 'Hauteur Levage',
            tempHydraulique: 'Temp. Hydraulique',
            pressionPompe: 'Pression Pompe',
            freinLevage: 'Frein Levage',
            freinOrient: 'Frein Orient.',
            tensionMoteur: 'Tension Moteur',
            frequence: 'Fréquence',
            puissance: 'Puissance',
            vitesseLevage: 'Vitesse de levage',
            angleOrientation: 'Angle Orientation',
            angleLuffage: 'Angle Luffage'
        },

        // Settings
        settings: {
            mqttBrokerUrl: 'URL du broker MQTT',
            usePi5: 'Utiliser Pi5'
        },

        // Time ranges
        time: {
            '1h': '1 heure',
            '6h': '6 heures',
            '24h': '24 heures',
            '7d': '7 jours',
            justNow: 'À l\'instant',
            minutesAgo: 'il y a {{count}} min',
            hoursAgo: 'il y a {{count}} h'
        },

        // Home
        home: {
            title: 'Tableau de bord BUM',
            subtitle: 'Plateforme de gestion intelligente des opérations portuaires',
            start3d: 'Démarrer 3D Temps réel',
            monitoring: 'Monitoring des engins',
            features: 'Fonctionnalités principales',
            comingSoon: 'Bientôt disponible'
        }
    }
}

// Initialize i18n
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en,
            fr
        },
        lng: localStorage.getItem('ems-language') || 'en',
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    })

// Language change handler that persists selection
export const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('ems-language', lng)
}

export const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
]

export default i18n
