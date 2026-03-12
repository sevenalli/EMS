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
            settings: 'Settings'
        },

        // Equipment
        equipment: {
            title: 'Equipment',
            status: 'Status',
            active: 'Active',
            standby: 'Standby',
            off: 'Off',
            maintenance: 'Maintenance',
            fuel: 'Fuel',
            load: 'Load',
            wind: 'Wind',
            temperature: 'Temperature',
            hydraulicTemp: 'Hydraulic Temp',
            noEquipment: 'No equipment found'
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
            noNotifications: 'No notifications'
        },

        // Export
        export: {
            title: 'Export',
            csv: 'Export CSV',
            pdf: 'Export PDF',
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
            status: 'Operational Status'
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
            settings: 'Paramètres'
        },

        // Equipment
        equipment: {
            title: 'Équipement',
            status: 'État',
            active: 'Actif',
            standby: 'En attente',
            off: 'Éteint',
            maintenance: 'Maintenance',
            fuel: 'Carburant',
            load: 'Charge',
            wind: 'Vent',
            temperature: 'Température',
            hydraulicTemp: 'Temp. hydraulique',
            noEquipment: 'Aucun équipement trouvé'
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
            noNotifications: 'Aucune notification'
        },

        // Export
        export: {
            title: 'Exporter',
            csv: 'Exporter CSV',
            pdf: 'Exporter PDF',
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
            status: 'État opérationnel'
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
