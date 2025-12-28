// Notification tag definitions - same as Angular inspiration
// Each tag maps to an MQTT boolean signal

export const NOTIFICATION_TAGS = [
    // Diesel Engine
    { tagName: 'Dieselmotor_Not_Aus', message: "ARRÊT D'URGENCE MOTEUR ACTIVÉ", type: 'Critical', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_Oeldruck_zu_niedrig_GHxK2', message: "Pression d'huile moteur critique (Basse)", type: 'Alarm', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_Kuehlwassertemperatur_zu_hoch_GI', message: 'Surchauffe moteur : Temp. eau trop élevée', type: 'Alarm', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_Kuehlwassermangel_GHxK2', message: 'Niveau liquide de refroidissement bas', type: 'Warning', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_Ueberdrehzahl_GHxK2', message: 'Alarme : Survitesse moteur détectée', type: 'Alarm', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_Wasser_im_Vorfilter_GHxK2', message: 'Eau détectée dans le préfiltre carburant', type: 'Warning', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_Ladeluftpumpe_Stoerung_GHxK2', message: "Défaut : Pompe d'air de suralimentation", type: 'Fault', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_EDC_Fehler_GHxK2', message: 'Erreur système injection (EDC)', type: 'Fault', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_MFR_Fehler_GHxK2', message: 'Erreur contrôleur moteur (MFR)', type: 'Fault', category: 'Diesel Engine' },
    { tagName: 'Dieselmotor_Abstellalarm_GHxK2', message: "Alarme d'arrêt moteur général", type: 'Alarm', category: 'Diesel Engine' },

    // Emergency
    { tagName: 'Fahrwerk_Not_Halt_ausgelost', message: "ARRÊT D'URGENCE TRANSLATION GÉNÉRAL", type: 'Critical', category: 'Emergency' },
    { tagName: 'Fahrwerk_Not_Halt_vorne_rechts', message: 'AU Translation : Avant Droite', type: 'Critical', category: 'Emergency' },
    { tagName: 'Fahrwerk_Not_Halt_vorne_links', message: 'AU Translation : Avant Gauche', type: 'Critical', category: 'Emergency' },
    { tagName: 'Fahrwerk_Not_Halt_hinten_rechts', message: 'AU Translation : Arrière Droite', type: 'Critical', category: 'Emergency' },
    { tagName: 'Fahrwerk_Not_Halt_hinten_links', message: 'AU Translation : Arrière Gauche', type: 'Critical', category: 'Emergency' },
    { tagName: 'OPT_Fahrwerk_Notendschalter_vorne', message: 'Fin de course urgence : Translation Avant', type: 'Warning', category: 'Emergency' },
    { tagName: 'OPT_Fahrwerk_Notendschalter_hinten', message: 'Fin de course urgence : Translation Arrière', type: 'Alarm', category: 'Emergency' },

    // Safety System
    { tagName: 'HW1_B_w_Sicherheits_SPS_Limit_Verschleigrenz', message: "Critique : Limite d'usure frein levage 1 atteinte", type: 'Critical', category: 'Safety System' },
    { tagName: 'HW1_B_w_Sicherheits_SPS_Warnung_Verschleigr', message: 'Avertissement : Usure frein levage 1', type: 'Warning', category: 'Safety System' },
    { tagName: 'HW1_B_w_Sicherheits_SPS_Sersorstwert_bei_Br', message: 'Défaut Capteur : Frein levage 1 reste ouvert', type: 'Fault', category: 'Safety System' },
    { tagName: 'Hubwerk1_Bremsschutz', message: 'Protection frein levage 1 déclenchée', type: 'Warning', category: 'Safety System' },
    { tagName: 'Drehwerk_Bremsschutz', message: 'Protection frein orientation déclenchée', type: 'Alarm', category: 'Safety System' },
    { tagName: 'OPT_Fahrwerk_Hinderniserkennung_vorne_rechts', message: 'Obstacle détecté : Avant Droite', type: 'Warning', category: 'Safety System' },
    { tagName: 'OPT_Fahrwerk_Hinderniserkennung_vorne_links', message: 'Obstacle détecté : Avant Gauche', type: 'Warning', category: 'Safety System' },

    // Electrical
    { tagName: 'VAR_Fremdeinspeisung_Temperaturuberwachung', message: 'Arrêt : Surchauffe transformateur externe', type: 'Critical', category: 'Electrical' },
    { tagName: 'Absicherung_Spreader', message: 'Défaut fusible : Spreader', type: 'Fault', category: 'Electrical' },
    { tagName: 'FI_Schutzschalter_Spreader', message: 'Disjoncteur différentiel Spreader déclenché', type: 'Fault', category: 'Electrical' },
    { tagName: 'Absicherung_Monitor_Turmkabine', message: 'Défaut alim. : Moniteur cabine', type: 'Fault', category: 'Electrical' },
    { tagName: 'Hauptsicherung_Arbeitsplatzbeleuchtung_Portal', message: 'Fusible éclairage portique grillé', type: 'Warning', category: 'Electrical' },

    // Status (Info)
    { tagName: 'Kranhauptschalter_ist_EIN', message: 'Grue sous tension (ON)', type: 'Info', category: 'Status' },
    { tagName: 'Uberwachung_Signal_Dieselmotor_in_Betrieb', message: 'Moteur Diesel en marche', type: 'Info', category: 'Status' },
    { tagName: 'Sturmbolzen_rechts_verriegelt', message: 'Verrouillage tempête engagé (Droite)', type: 'Info', category: 'Status' },
    { tagName: 'Sturmbolzen_links_verriegelt', message: 'Verrouillage tempête engagé (Gauche)', type: 'Info', category: 'Status' },
    { tagName: 'Ruckmeldung_Container_verriegelt', message: 'Container Verrouillé', type: 'Info', category: 'Status' },

    // System
    { tagName: 'Abschaltung_Programm_durch_DP_Bus_Fehler', message: 'Arrêt Programme : Erreur Bus Profibus (DP)', type: 'Critical', category: 'System' },
    { tagName: 'Abschaltung_Programm_durch_ASI_Bus_Fehler', message: 'Arrêt Programme : Erreur Bus ASI', type: 'Critical', category: 'System' },

    // Spreader
    { tagName: 'Ruckmeldung_Container_entriegelt', message: 'Container Déverrouillé', type: 'Info', category: 'Spreader' },
    { tagName: 'Ruckmeldung_Spreader_aufgesetzt', message: 'Spreader posé sur container (Landed)', type: 'Info', category: 'Spreader' },
    { tagName: 'Ruckmeldung_Spreader_in_Mittelstellung', message: 'Spreader centré (Mittelstellung)', type: 'Info', category: 'Spreader' },
    { tagName: 'RCLD_Ruckmeldung_Twistlocks_verriegelt', message: 'Twistlocks Verrouillés (Feedback RCLD)', type: 'Info', category: 'Spreader' },
    { tagName: 'Twistlocks_verriegeln', message: 'Commande verrouiller Twistlocks', type: 'Info', category: 'Spreader' },
    { tagName: 'Twistlocks_entriegeln', message: 'Commande déverrouiller Twistlocks', type: 'Info', category: 'Spreader' },

    // Hoist
    { tagName: 'Hubwerk1_Schnelle_Getriebestufe_aktiv', message: 'Levage 1 : Vitesse rapide active', type: 'Info', category: 'Hoist' },
    { tagName: 'Hubwerk1_Mittlere_Getriebestufe_aktiv', message: 'Levage 1 : Vitesse moyenne active', type: 'Info', category: 'Hoist' },
    { tagName: 'Hubwerk1_Langsame_Getriebestufe_aktiv', message: 'Levage 1 : Vitesse lente active', type: 'Info', category: 'Hoist' },
    { tagName: 'Hubwerk1_Freigabe_Fahrkommando_Heben', message: 'Levage 1 : Autorisation commande monter', type: 'Info', category: 'Hoist' },
    { tagName: 'Hubwerk1_Freigabe_Fahrkommando_Senken', message: 'Levage 1 : Autorisation commande descendre', type: 'Info', category: 'Hoist' },
    { tagName: 'Hubwerk1_Fehler_Getriebeumschaltung', message: 'Erreur changement de vitesse Levage 1', type: 'Fault', category: 'Hoist' },
    { tagName: 'Hubwerk2_Absicherung_Spannungsversorgung', message: 'Levage 2 : Protection alimentation', type: 'Fault', category: 'Hoist' },

    // Slewing
    { tagName: 'Entrainement_mecanisme_d_orientation', message: "Entraînement mécanisme d'orientation", type: 'Info', category: 'Slewing' },
    { tagName: 'TK_Steuerhebel_Drehwerk_Lenken_Nach_links', message: 'Levier commande : Orientation vers gauche', type: 'Info', category: 'Slewing' },
    { tagName: 'TK_Steuerhebel_Drehwerk_Lenken_Nach_rechts', message: 'Levier commande : Orientation vers droite', type: 'Info', category: 'Slewing' },
    { tagName: 'TK_Totmanntaste_Drehwerk_Wippwerk', message: 'Bouton homme mort : Orientation/Volée', type: 'Info', category: 'Slewing' },
    { tagName: 'Hakenschwenkwerk_Rechts_drehen', message: 'Rotation crochet vers droite', type: 'Info', category: 'Slewing' },
    { tagName: 'Hakenschwenkwerk_Links_drehen', message: 'Rotation crochet vers gauche', type: 'Info', category: 'Slewing' },

    // Luffing
    { tagName: 'TK_Steuerhebel_Wippen_Einwippen', message: 'Levier commande : Volée - Relevage', type: 'Info', category: 'Luffing' },
    { tagName: 'TK_Steuerhebel_Wippen_Auswippen', message: 'Levier commande : Volée - Abaissement', type: 'Info', category: 'Luffing' },
    { tagName: 'Wippwerk_Freigabe_Fahrkommando_Einwippen', message: 'Volée : Autorisation commande relevage', type: 'Info', category: 'Luffing' },
    { tagName: 'Wippwerk_Freigabe_Fahrkommando_Auswippen', message: 'Volée : Autorisation commande abaissement', type: 'Info', category: 'Luffing' },

    // Travel
    { tagName: 'Schienenbremse_rechts_Oldruck_erreicht_0', message: 'Défaut Pression : Frein Rail Droit', type: 'Alarm', category: 'Travel' },
    { tagName: 'Schienenbremse_links_Oldruck_erreicht_0', message: 'Défaut Pression : Frein Rail Gauche', type: 'Alarm', category: 'Travel' },
    { tagName: 'Fahrwerk_Fahren_schnell', message: 'Translation : Mode rapide', type: 'Info', category: 'Travel' },
    { tagName: 'Fahrwerk_Fahren_mittel', message: 'Translation : Mode moyen', type: 'Info', category: 'Travel' },
    { tagName: 'Fahrwerk_Fahren_langsam', message: 'Translation : Mode lent', type: 'Info', category: 'Travel' },
    { tagName: 'Schienenbremsen_geoffnet', message: 'Freins sur rails ouverts', type: 'Info', category: 'Travel' },

    // Chassis
    { tagName: 'Kran_abgestutzt', message: 'Grue entièrement calée (Stabilisateurs OK)', type: 'Info', category: 'Chassis' },
    { tagName: 'Oberwagen_und_Unterwagen_verriegelt', message: 'Chassis et Tourelle Verrouillés', type: 'Info', category: 'Chassis' },
    { tagName: 'Sturmbolzen_entriegelt', message: 'Verrous tempête déverrouillés (Prêt à rouler)', type: 'Info', category: 'Chassis' },

    // Cable Reel
    { tagName: 'Fahrleitungstrommel_leer', message: 'Attention : Enrouleur câble VIDE', type: 'Warning', category: 'Cable Reel' },
    { tagName: 'Fahrleitungstrommel_voll', message: 'Info : Enrouleur câble PLEIN', type: 'Info', category: 'Cable Reel' },
    { tagName: 'Motorleitungstrommel_Endschalter_Abwickeln', message: 'Enrouleur moteur : Fin course dérouler', type: 'Warning', category: 'Cable Reel' },
    { tagName: 'Motorleitungstrommel_Endschalter_Aufwickeln', message: 'Enrouleur moteur : Fin course enrouler', type: 'Warning', category: 'Cable Reel' },

    // Remote Control
    { tagName: 'FFB_Not_Aus_Taste_nicht_betatigt', message: 'Arrêt Urgence Radio : OK (Non actionné)', type: 'Info', category: 'Remote Control' },
    { tagName: 'FFB_Meldung_Hauptschaler_Ein', message: 'Interrupteur principal Radio : ON', type: 'Info', category: 'Remote Control' },
    { tagName: 'FFB_Eingeschaltet', message: 'Radiocommande Connectée', type: 'Info', category: 'Remote Control' },

    // Outriggers
    { tagName: 'Uberbruckung_fur_Notbetatigung_Abstutzung', message: 'Pontage urgence calage', type: 'Warning', category: 'Outriggers' },
    { tagName: 'Abstutztrager_vorne_links_rot_abgetutzt', message: 'Porteur AV gauche (rouge) calé', type: 'Info', category: 'Outriggers' },
    { tagName: 'Abstutztrager_vorne_rechts_blau_abgetutzt', message: 'Porteur AV droit (bleu) calé', type: 'Info', category: 'Outriggers' },
    { tagName: 'Abstutztrager_hinten_rechts_gelb_abgestutzt', message: 'Porteur AR droit (jaune) calé', type: 'Info', category: 'Outriggers' },
    { tagName: 'Abstutztrager_hinten_links_grun_abgestutzt', message: 'Porteur AR gauche (vert) calé', type: 'Info', category: 'Outriggers' },
];

// Get unique categories
export const NOTIFICATION_CATEGORIES = [...new Set(NOTIFICATION_TAGS.map(t => t.category))];

// Type colors
export const TYPE_COLORS = {
    Critical: { bg: 'bg-red-500', text: 'text-white', border: 'border-red-500', bgLight: 'bg-red-500/20' },
    Alarm: { bg: 'bg-amber-500', text: 'text-black', border: 'border-amber-500', bgLight: 'bg-amber-500/20' },
    Warning: { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500', bgLight: 'bg-orange-500/20' },
    Fault: { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500', bgLight: 'bg-gray-500/20' },
    Info: { bg: 'bg-cyan-500', text: 'text-white', border: 'border-cyan-500', bgLight: 'bg-cyan-500/20' },
};

// Type icons (using lucide-react names)
export const TYPE_ICONS = {
    Critical: 'AlertOctagon',
    Alarm: 'Bell',
    Warning: 'AlertTriangle',
    Fault: 'XCircle',
    Info: 'Info',
};
