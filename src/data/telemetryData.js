/**
 * Telemetry Tag Definitions
 * Based on supension.component.ts - all crane telemetry data (150+ tags)
 */

// Complete tag name mappings for MQTT (from supension.component.ts HISTORY_TAG_NAMES)
export const TAG_MAPPINGS = {
    // ===================== EQUIPMENT CARD ALIASES =====================
    // These are aliased names used by EquipmentCard component
    fuelLevel: 'Reservoir_de_carburant_diesel_niveau_de_remplissage_en',
    loadWeight: 'Charge_nette_en_tonnes',
    windSpeed: 'Vitesse_du_vent_valeur_reelle',
    hydraulicTemp: 'Temperature_du_systeme_hydraulique',
    // Status detection aliases
    dieselRunning: 'Uberwachung_Signal_Dieselmotor_in_Betrieb',
    mainSwitch: 'Kranhauptschalter_ist_EIN',
    // Accessory detection aliases
    spreader: 'Ruckmeldung_1_Spreader_gesteckt',
    twinlift: 'VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt',

    // ===================== LOAD & SAFETY =====================
    chargeNette: 'Charge_nette_en_tonnes',
    vitesseVent: 'Vitesse_du_vent_valeur_reelle',
    hauteurLevageAdmissible: 'Hauteur_de_levage_admissible_en_pourcentage',
    compteurSpectre: 'Compteur_spectre_de_charge_du_mec_levage',

    // ===================== SPEED & MOTION =====================
    vitesseMecLevage: 'Vitesse_du_mec_levage_en_m_min',
    vitesseOrientation: 'Vitesse_d_orientation_maxi_en_tr_min_reduite',

    // ===================== ENGINE & ENERGY =====================
    niveauCarburant: 'Reservoir_de_carburant_diesel_niveau_de_remplissage_en',
    temperatureMoteur: 'Temperature_du_moteur_en_degres_Celsius',
    puissanceMesuree: 'Puissance_mesuree_en_kW',
    courantApparent: 'Courant_apparent',

    // ===================== ELECTRICAL =====================
    courantReel: 'Valeur_reelle_du_courant_en_A',
    tensionMoteur: 'Valeur_reelle_tension_moteur_en_V',
    frequenceReseau: 'Frequence_de_reseau',
    tensionReseauFreinage: 'Tension_reseau_du_simoreg_de_freinage',
    coupleEntrainement: 'Valeur_reelle_du_couple_venant_de_l_entrainement',

    // ===================== TEMPERATURES =====================
    tempHuileReducteur: 'Mec_levage_1_temperature_de_l_huile_du_reducteur',
    tempMoteurLevage: 'Mec_levage_1_temperature_du_moteur_en_degres_Celsius',
    tempMoteurOrientation: 'Mec_orient_1_temperature_du_moteur_en_degres_Celsius',
    tempAlternateur1: 'Alternateur_valeur_de_temperature_1_PT100',
    tempAlternateur2: 'Alternateur_valeur_de_temperature_2_PT100',

    // ===================== HYDRAULICS =====================
    tempHydraulique: 'Temperature_du_systeme_hydraulique',
    pressionPompe: 'Valeur_reelle_pression_de_pompe',
    pressionVolee: 'Pression_mec_de_volee_cote_fond',
    pressionFreinLevage: 'Pression_de_service_pour_le_frein_du_mec_de_levage',
    pressionFreinOrientation: 'Pression_de_service_du_frein_dorientation_1',
    pressionNiveau2: 'Valeur_pression_pr_niv_de_press_2_en_bars',
    pressionDruckstufe7: 'Druckwert_fur_Druckstufe_7_in_bar',
    anglePivotPompe: 'Valeur_reelle_angle_de_pivotement_pompe_1',

    // ===================== LOAD MECHANICS =====================
    coupleCharge: 'Couple_de_charge_en_metres_x_tonnes',
    chargeBruteDMS1: 'Charge_brute_mec_levage_1_jauge_DMS_1',
    chargeBruteDMS2: 'Charge_brute_mec_levage_1_jauge_DMS_2',
    lastmessbolzenDMS1: 'Lastmessbolzen_Hubwerk_1_DMS_1',
    lastmessbolzenDMS2: 'Lastmessbolzen_Hubwerk_1_DMS_2',

    // ===================== POSITION & GEOMETRY =====================
    porteeMetres: 'Portee_en_metres',
    angleOrientation: 'Angle_d_orientation_superstructure_chassis_valeur_reelle',
    hauteurLevage: 'Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu',
    calageAngleX: 'Calage_angle_de_laxe_X',
    calageAngleY: 'Calage_angle_de_laxe_Y',

    // ===================== GROSS LOAD =====================
    chargeBrute: 'Charge_brute_en_tonnes',
    chargeBruteAdmissible: 'Charge_brute_en_tonnes_admissible',
    chargeBruteRelative: 'Charge_brute_relative',
    chargeNetteAdmissible: 'Charge_nette_admissible_en_tonnes',
    coupleChargeNominal: 'Couple_de_charge_nominal',

    // ===================== SPEED LIMITS =====================
    vitesseLevageAdmissible: 'Mec_levage_vitesse_admissible_en_m_min',
    vitesseMaxiPeripherie: 'Vitesse_maxi_a_la_peripherie_en_m_min_reduite',
    vitesseMaxiGrue: 'Vitesse_maxi_de_la_grue_en_tr_min',
    tempsAcceleration: 'Temps_d_acceleration_effectif_en_sec',

    // ===================== CYLINDER PRESSURES =====================
    pressionVoleeTige: 'Pression_mec_de_volee_cote_tige',
    pressionFreinOrientation2: 'Pression_de_service_du_frein_dorientation_2',
    consignePompe: 'Valeur_de_consigne_pompe_hydraulique',
    anglePivotPompe2: 'Valeur_reelle_angle_de_pivotement_pompe_2',
    anglePivotPompe3: 'Valeur_reelle_angle_de_pivotement_pompe_3',

    // ===================== OPERATIONAL STATUS =====================
    dieselEnMarche: 'Uberwachung_Signal_Dieselmotor_in_Betrieb',
    kranHauptschalter: 'Kranhauptschalter_ist_EIN',
    spreaderConnected: 'Ruckmeldung_1_Spreader_gesteckt',
    twinliftConnected: 'VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt',
    containerVerrouille: 'Ruckmeldung_Container_verriegelt',

    // ===================== GEAR & TRANSMISSION =====================
    getriebeStufeI: 'Hubwerk1_Getriebeumschaltung_Endstellung_Getriebestufe_I_langsam',
    getriebeStufeII: 'Hubwerksgetriebeumschaltung_Endstellung_Getriebestufe_II_Mittel_schnell',
    getriebeStufeIII: 'Hubwerksgetriebeumschaltung_Getriebestufe_III_schnell',
    vitesseTranslationRapide: 'Vitesse_de_translation_rapide_m_min',
    vitesseTranslationMoyenne: 'Vitesse_de_translation_moyenne_m_min',
    vitesseTranslationLente: 'Vitesse_de_translation_lente_m_min',

    // ===================== MAINTENANCE COUNTERS =====================
    heuresService: 'Compteur_d_heures_de_service_heures',
    heuresDepuisEntretien: 'Compteur_d_heures_de_service_heures_depuis_le_dernier_entretien',
    heuresAvantEntretien: 'Compteur_d_heures_de_service_heures_jusqu_au_prochain_entretien',

    // ===================== BOOM ANGLE =====================
    angleFleche: 'Angle_de_la_fleche_unite_en_degres_0_90_degres',
    porteeCodeurAbsolu: 'Portee_en_metres_codeur_absolu',

    // ===================== ENGINE SENSORS =====================
    tempEauRadiateur: 'Tempertur_Dieselmotor_Wasserkuhler',
    tempAirTurbo: 'Tempertur_Dieselmotor_Ladeluft',

    // ===================== ELECTRICAL / DRIVES =====================
    tensionBusDC: 'Tension_du_circuit_intermediaire_en_V',
    puissanceActive: 'Puissance_en_kW',
    consigneVitesseMoteur: 'Valeur_de_consigne_vitesse_moteur',
    vitesseMoteurReelle: 'Valeur_reelle_vitesse_en_t_min',
    tempMoteurOrient2: 'Mec_orient_2_temperature_du_moteur_en_degres_Celsius',

    // ===================== ADDITIONAL HYDRAULICS =====================
    anglePivotPompe4: 'Valeur_reelle_angle_de_pivotement_pompe_4',
    pressionFreinOrientation3: 'Pression_de_service_du_frein_dorientation_3',
    pressionCapteurFondM2: 'Wippwerk_Drucksensor_Bodenseite_M2',
    pressionCapteurTigeM3: 'Wippwerk_Drucksensor_Stangenseite_M3',

    // ===================== HOIST TELEMETRY =====================
    consigneManipFermeture: 'Valeur_de_consigne_manipulateur_pour_fermeture',
    consigneManipLevage: 'Valeur_de_consigne_manipulateur_pour_levage',
    pressionFreinFermeture: 'Pression_de_service_pour_le_frein_du_mec_de_fermeture',
    chargeBruteDiffDMS12: 'Charge_brute_mec_levage_1_difference_jauges_DMS_1_2',
    chargeBrutePorteeMetres: 'Charge_brute_en_tonnes_en_portee_x_metres',
    chargeBruteLevage2DiffDMS12: 'Charge_brute_mec_levage_2_difference_jauges_DMS_1_2',
    hauteurLevageAdmCalc1: 'Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_1',
    hauteurLevageAdmCalc2: 'Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_2',
    hauteurLevageAdmCalculee: 'Hauteur_de_levage_admissible_pour_le_levage_calculee',
    consigneVitesseRotationCharge: 'Calculer_valeur_consigne_vitesse_rotation_du_mec_levage_suivant_la_charge',
    vitesseLevageAdmTMin: 'Mecanisme_de_levage_vitesse_admissible_en_t_min',
    rapportTransmissionRapide: 'Rapport_de_transmission_reducteur_pour_mec_de_levage_vitesse_rapide',
    betriebsdruckHW1: 'Betriebsdruck_HW1_Bremse',
    betriebsdruckHW2: 'Betriebsdruck_HW2_Bremse',

    // ===================== SLEW TELEMETRY =====================
    consigneManipOrientation: 'Valeur_de_consigne_manipulateur_pour_orientation',
    consigneVitesseOrientPortee: 'Calculer_val_consigne_vitesse_du_mec_orientation_suivant_la_portee',
    betriebsdruckDrehwerk1: 'Betriebsdruck_Drehwerksbremse_1',
    consigneFixeOrientDroite: 'Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_droite',
    consigneFixeOrientGauche: 'Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_gauche',

    // ===================== LUFFING TELEMETRY =====================
    vitesseReelleCylindre: 'Vitesse_reelle_du_cylindre_de_variation_de_volee',
    consigneManipVolee: 'Valeur_de_consigne_manipulateur_pour_volee',
    porteeAdmissibleCharge: 'Portee_regime_admissible_en_fonction_de_la_charge',
    relevageCalculerPorteeAdm: 'Relevage_fleche_calculer_la_portee_admissible',
    abaissementCalculerPorteeAdm: 'Abaissement_fleche_calculer_la_portee_admissible',
    porteeAdmRelevageCalc1: 'Portee_admissible_relevage_fleche_sans_limitation_calcul_1',
    porteeAdmRelevageCalc2: 'Portee_admissible_relevage_fleche_sans_limitation_calcul_2',
    reductionConsigneEtranglementVolee: 'Reduction_valeur_de_consigne_de_la_soupape_detranglement_du_mec_de_volee',

    // ===================== TRANSLATION TELEMETRY =====================
    consigneTranslation: 'Valeur_de_consigne_translation',
    translationValeurConsigne: 'Translation_valeur_de_consigne',
    sollwertDruckLenkpumpe1: 'Sollwert_Druckabschneidung_Lenkpumpe_1',
    sollwertDruckLenkpumpe2: 'Sollwert_Druckabschneidung_Lenkpumpe_2',

    // ===================== HOIST CALIBRATION =====================
    cu1Pzd4Hoist1Dms1P1: 'CU1_PZD4_Hoist1_DMS1_P1_Abgleich',
    cu1Pzd5Hoist1Dms2P1: 'CU1_PZD5_Hoist1_DMS2_P1_Abgleich',
    cu1Pzd6Hoist1Dms1P2: 'CU1_PZD6_Hoist1_DMS1_P2_Abgleich',
    cu1Pzd7Hoist1Dms2P2: 'CU1_PZD7_Hoist1_DMS2_P2_Abgleich',
    cu1Pzd8Hoist2Dms1P1: 'CU1_PZD8_Hoist2_DMS1_P1_Abgleich',
    cu1Pzd9Hoist2Dms2P1: 'CU1_PZD9_Hoist2_DMS2_P1_Abgleich',
    cu1Pzd10Hoist2Dms1P2: 'CU1_PZD10_Hoist2_DMS1_P2_Abgleich',
    cu1Pzd11Hoist2Dms2P2: 'CU1_PZD11_Hoist2_DMS2_P2_Abgleich',

    // ===================== HOIST TORQUE =====================
    levageCoupleAccelRapide: 'Levage_couple_d_acceleration_vitesse_rapide',
    levageCoupleFreinRapide: 'Levage_couple_de_freinage_vitesse_rapide',
    levageCoupleAccelMoyen: 'Levage_couple_d_acceleration_vitesse_moyenne',
    levageCoupleFreinMoyen: 'Levage_couple_de_freinage_vitesse_moyenne',
    levageCoupleAccelLent: 'Levage_couple_d_acceleration_vitesse_lente',
    levageCoupleFreinLent: 'Levage_couple_de_freinage_vitesse_lente',

    // ===================== LUFFING TORQUE =====================
    abaissCouplAccelRapide: 'Abaisser_la_fleche_couple_d_acceleration_vitesse_rapide',
    abaissCouplFreinRapide: 'Abaisser_la_fleche_couple_de_freinage_vitesse_rapide',
    relevageCouplAccelRapide: 'Relevage_de_la_fleche_couple_d_acceleration_vitesse_rapide',
    relevageCouplFreinRapide: 'Relevage_de_la_fleche_couple_de_freinage_vitesse_rapide',
    abaissCouplAccelMoyen: 'Abaisser_la_fleche_couple_d_acceleration_vitesse_moyenne',
    abaissCouplFreinMoyen: 'Abaisser_la_fleche_couple_de_freinage_vitesse_moyenne',
    relevageCouplAccelMoyen: 'Relevage_de_la_fleche_couple_d_acceleration_vitesse_moyenne',
    relevageCouplFreinMoyen: 'Relevage_de_la_fleche_couple_de_freinage_vitesse_moyenne',
    abaissCouplAccelLent: 'Abaisser_la_fleche_couple_d_acceleration_vitesse_lente',
    abaissCouplFreinLent: 'Abaisser_la_fleche_couple_de_freinage_vitesse_lente',
    relevageCouplAccelLent: 'Relevage_de_la_fleche_couple_d_acceleration_vitesse_lente',
    relevageCouplFreinLent: 'Relevage_de_la_fleche_couple_de_freinage_vitesse_lente',

    // ===================== LUFFING VALVES =====================
    sollwerteDrosselTandemliftYminP: 'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINP',
    sollwerteDrosselTandemliftYmaxP: 'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXP',
    sollwerteDrosselTandemliftYminN: 'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINN',
    sollwerteDrosselTandemliftYmaxN: 'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXN',

    // ===================== TRANSLATION CONTROL =====================
    consignePompeTranslRapideYminP: 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINP',
    consignePompeTranslRapideYmaxP: 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXP',
    consignePompeTranslRapideYminN: 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINN',
    consignePompeTranslRapideYmaxN: 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXN',
    consigneSoupapeTranslRapideYminP: 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINP',
    consigneSoupapeTranslRapideYmaxP: 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXP',
    consigneSoupapeTranslRapideYminN: 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINN',
    consigneSoupapeTranslRapideYmaxN: 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXN',

    // ===================== GRAB CONTROL =====================
    motorGrabActive: 'Motorgreiferbetrieb',
    grabCmdClose: 'TK_Steuerhebel_Motorgreifer_Hubwerk2_Schlieen',
    grabCmdOpen: 'TK_Steuerhebel_Motorgreifer_Hubwerk2_Offnen',

}

// Widget category definitions for dashboard (expanded with all categories)
export const TELEMETRY_CATEGORIES = {
    loadSafety: {
        title: 'Load & Safety',
        icon: 'Weight',
        color: 'green',
        widgets: [
            { key: 'chargeNette', label: 'Charge Nette', unit: 't', min: 0, max: 41, type: 'gauge' },
            { key: 'vitesseVent', label: 'Wind Speed', unit: 'm/s', min: 0, max: 20, type: 'digital-status' },
            { key: 'hauteurLevageAdmissible', label: 'Hauteur Levage', unit: '%', min: 0, max: 100, type: 'vertical-bar' },
            { key: 'compteurSpectre', label: 'Compteur Spectre', unit: 'SWP', type: 'odometer' },
        ]
    },
    speedMotion: {
        title: 'Speed & Motion',
        icon: 'Gauge',
        color: 'blue',
        widgets: [
            { key: 'vitesseMecLevage', label: 'Vitesse Levage', unit: 'm/min', min: -105, max: 105, type: 'digital' },
            { key: 'vitesseOrientation', label: 'Vitesse Orient.', unit: 'rpm', min: 0, max: 1.6, type: 'digital' },
            { key: 'vitesseTranslationRapide', label: 'Transl. Rapide', unit: 'm/min', type: 'digital' },
            { key: 'vitesseTranslationMoyenne', label: 'Transl. Moyenne', unit: 'm/min', type: 'digital' },
        ]
    },
    engineEnergy: {
        title: 'Engine & Energy',
        icon: 'Fuel',
        color: 'amber',
        widgets: [
            { key: 'niveauCarburant', label: 'Fuel Level', unit: '%', min: 0, max: 100, type: 'fuel-tank' },
            { key: 'temperatureMoteur', label: 'Engine Temp', unit: '°C', min: 0, max: 110, type: 'thermometer' },
            { key: 'puissanceMesuree', label: 'Puissance', unit: 'kW', min: 0, max: 900, type: 'digital' },
            { key: 'courantApparent', label: 'Courant', unit: 'A', min: 0, max: 400, type: 'digital' },
        ]
    },
    electrical: {
        title: 'Electrical',
        icon: 'Zap',
        color: 'yellow',
        widgets: [
            { key: 'courantReel', label: 'Courant Réel', unit: 'A', min: 0, max: 600, type: 'digital' },
            { key: 'tensionMoteur', label: 'Tension Moteur', unit: 'V', min: 0, max: 480, type: 'digital' },
            { key: 'frequenceReseau', label: 'Fréquence', unit: 'Hz', min: 48, max: 52, type: 'digital-status' },
            { key: 'tensionBusDC', label: 'Tension DC Bus', unit: 'V', type: 'digital' },
            { key: 'puissanceActive', label: 'Puissance Active', unit: 'kW', type: 'digital' },
        ]
    },
    temperatures: {
        title: 'Temperatures',
        icon: 'Thermometer',
        color: 'red',
        widgets: [
            { key: 'tempHuileReducteur', label: 'Huile Reduct.', unit: '°C', min: 20, max: 90, type: 'thermometer' },
            { key: 'tempMoteurLevage', label: 'Moteur Levage', unit: '°C', min: 20, max: 110, type: 'thermometer' },
            { key: 'tempMoteurOrientation', label: 'Moteur Orient.', unit: '°C', min: 20, max: 100, type: 'digital' },
            { key: 'tempAlternateur1', label: 'Alternateur 1', unit: '°C', min: 20, max: 100, type: 'digital' },
            { key: 'tempAlternateur2', label: 'Alternateur 2', unit: '°C', min: 20, max: 100, type: 'digital' },
            { key: 'tempEauRadiateur', label: 'Eau Radiateur', unit: '°C', type: 'digital' },
            { key: 'tempAirTurbo', label: 'Air Turbo', unit: '°C', type: 'digital' },
        ]
    },
    hydraulics: {
        title: 'Hydraulics',
        icon: 'Droplets',
        color: 'cyan',
        widgets: [
            { key: 'tempHydraulique', label: 'Temp. Hydraulique', unit: '°C', min: 10, max: 90, type: 'gauge' },
            { key: 'pressionPompe', label: 'Pression Pompe', unit: 'bar', min: 0, max: 350, type: 'gauge' },
            { key: 'pressionVolee', label: 'Pression Volée', unit: 'bar', min: 0, max: 400, type: 'digital' },
            { key: 'pressionFreinLevage', label: 'Frein Levage', unit: 'bar', min: 0, max: 150, type: 'digital' },
            { key: 'pressionFreinOrientation', label: 'Frein Orient.', unit: 'bar', min: 0, max: 150, type: 'digital' },
            { key: 'anglePivotPompe', label: 'Angle Pompe', unit: '°', min: -20, max: 20, type: 'digital' },
        ]
    },
    loadMechanics: {
        title: 'Load Mechanics',
        icon: 'Scale',
        color: 'orange',
        widgets: [
            { key: 'coupleCharge', label: 'Couple Charge', unit: 'mt', min: 0, max: 3000, type: 'digital' },
            { key: 'chargeBruteDMS1', label: 'DMS 1', unit: 't', min: 0, max: 50, type: 'digital' },
            { key: 'chargeBruteDMS2', label: 'DMS 2', unit: 't', min: 0, max: 50, type: 'digital' },
            { key: 'lastmessbolzenDMS1', label: 'Bolzen DMS1', unit: 'raw', type: 'digital' },
            { key: 'lastmessbolzenDMS2', label: 'Bolzen DMS2', unit: 'raw', type: 'digital' },
        ]
    },
    position: {
        title: 'Position & Geometry',
        icon: 'Compass',
        color: 'purple',
        widgets: [
            { key: 'porteeMetres', label: 'Portée', unit: 'm', type: 'digital' },
            { key: 'angleOrientation', label: 'Angle Orient.', unit: '°', type: 'digital' },
            { key: 'hauteurLevage', label: 'Hauteur Levage', unit: 'm', type: 'digital' },
            { key: 'angleFleche', label: 'Angle Flèche', unit: '°', min: 0, max: 90, type: 'gauge' },
            { key: 'calageAngleX', label: 'Calage X', unit: '°', type: 'digital' },
            { key: 'calageAngleY', label: 'Calage Y', unit: '°', type: 'digital' },
        ]
    },
    grossLoad: {
        title: 'Gross Load',
        icon: 'Weight',
        color: 'emerald',
        widgets: [
            { key: 'chargeBrute', label: 'Charge Brute', unit: 't', type: 'gauge' },
            { key: 'chargeBruteAdmissible', label: 'Charge Adm.', unit: 't', type: 'digital' },
            { key: 'chargeBruteRelative', label: 'Charge Rel.', unit: '%', min: 0, max: 100, type: 'vertical-bar' },
            { key: 'chargeNetteAdmissible', label: 'Nette Adm.', unit: 't', type: 'digital' },
            { key: 'coupleChargeNominal', label: 'Couple Nom.', unit: 'mt', type: 'digital' },
        ]
    },
    speedLimits: {
        title: 'Speed Limits',
        icon: 'AlertTriangle',
        color: 'rose',
        widgets: [
            { key: 'vitesseLevageAdmissible', label: 'Vitesse Levage Adm.', unit: 'm/min', type: 'digital' },
            { key: 'vitesseMaxiPeripherie', label: 'Vitesse Périph.', unit: 'm/min', type: 'digital' },
            { key: 'vitesseMaxiGrue', label: 'Vitesse Max Grue', unit: 'rpm', type: 'digital' },
            { key: 'tempsAcceleration', label: 'Temps Accél.', unit: 's', type: 'digital' },
        ]
    },
    status: {
        title: 'Operational Status',
        icon: 'Power',
        color: 'lime',
        widgets: [
            { key: 'dieselEnMarche', label: 'Diesel', type: 'boolean' },
            { key: 'kranHauptschalter', label: 'Main Switch', type: 'boolean' },
            { key: 'spreaderConnected', label: 'Spreader', type: 'boolean' },
            { key: 'twinliftConnected', label: 'Twinlift', type: 'boolean' },
            { key: 'containerVerrouille', label: 'Container', type: 'boolean' },
        ]
    },
    gear: {
        title: 'Gear & Transmission',
        icon: 'Settings',
        color: 'slate',
        widgets: [
            { key: 'getriebeStufeI', label: 'Gear I (Slow)', type: 'boolean' },
            { key: 'getriebeStufeII', label: 'Gear II (Med)', type: 'boolean' },
            { key: 'getriebeStufeIII', label: 'Gear III (Fast)', type: 'boolean' },
            { key: 'vitesseTranslationLente', label: 'Transl. Lente', unit: 'm/min', type: 'digital' },
        ]
    },
    maintenance: {
        title: 'Maintenance',
        icon: 'Clock',
        color: 'gray',
        widgets: [
            { key: 'heuresService', label: 'Total Hours', unit: 'h', type: 'odometer' },
            { key: 'heuresDepuisEntretien', label: 'Since Maint.', unit: 'h', type: 'digital' },
            { key: 'heuresAvantEntretien', label: 'Before Maint.', unit: 'h', type: 'digital-warning' },
        ]
    },
    hoist: {
        title: 'Hoist Telemetry',
        icon: 'ArrowUpDown',
        color: 'indigo',
        widgets: [
            { key: 'consigneManipLevage', label: 'Consigne Levage', unit: '%', type: 'digital' },
            { key: 'pressionFreinFermeture', label: 'Pression Frein', unit: 'bar', type: 'digital' },
            { key: 'betriebsdruckHW1', label: 'Pression HW1', unit: 'bar', type: 'digital' },
            { key: 'betriebsdruckHW2', label: 'Pression HW2', unit: 'bar', type: 'digital' },
            { key: 'hauteurLevageAdmCalculee', label: 'Haut. Adm. Calc.', unit: 'm', type: 'digital' },
        ]
    },
    slew: {
        title: 'Slew Telemetry',
        icon: 'RotateCcw',
        color: 'teal',
        widgets: [
            { key: 'consigneManipOrientation', label: 'Consigne Orient.', unit: '%', type: 'digital' },
            { key: 'consigneVitesseOrientPortee', label: 'Cons. Vit. Portée', unit: '%', type: 'digital' },
            { key: 'betriebsdruckDrehwerk1', label: 'Pression Drehwerk', unit: 'bar', type: 'digital' },
        ]
    },
    luffing: {
        title: 'Luffing Telemetry',
        icon: 'MoveVertical',
        color: 'violet',
        widgets: [
            { key: 'consigneManipVolee', label: 'Consigne Volée', unit: '%', type: 'digital' },
            { key: 'vitesseReelleCylindre', label: 'Vitesse Cylindre', unit: 'm/s', type: 'digital' },
            { key: 'porteeAdmissibleCharge', label: 'Portée Adm.', unit: 'm', type: 'digital' },
            { key: 'relevageCalculerPorteeAdm', label: 'Relevage Portée', unit: 'm', type: 'digital' },
            { key: 'abaissementCalculerPorteeAdm', label: 'Abaiss. Portée', unit: 'm', type: 'digital' },
        ]
    },
    translation: {
        title: 'Translation',
        icon: 'Truck',
        color: 'fuchsia',
        widgets: [
            { key: 'consigneTranslation', label: 'Consigne Transl.', unit: '%', type: 'digital' },
            { key: 'translationValeurConsigne', label: 'Valeur Consigne', unit: '%', type: 'digital' },
            { key: 'sollwertDruckLenkpumpe1', label: 'Pression Lenk 1', unit: 'bar', type: 'digital' },
            { key: 'sollwertDruckLenkpumpe2', label: 'Pression Lenk 2', unit: 'bar', type: 'digital' },
        ]
    },
    cylinderPressures: {
        title: 'Cylinder Pressures',
        icon: 'Gauge',
        color: 'sky',
        widgets: [
            { key: 'pressionVoleeTige', label: 'Volée Tige', unit: 'bar', type: 'digital' },
            { key: 'pressionFreinOrientation2', label: 'Frein Orient. 2', unit: 'bar', type: 'digital' },
            { key: 'pressionFreinOrientation3', label: 'Frein Orient. 3', unit: 'bar', type: 'digital' },
            { key: 'consignePompe', label: 'Consigne Pompe', unit: '%', type: 'digital' },
            { key: 'anglePivotPompe2', label: 'Angle Pompe 2', unit: '°', type: 'digital' },
            { key: 'anglePivotPompe3', label: 'Angle Pompe 3', unit: '°', type: 'digital' },
            { key: 'anglePivotPompe4', label: 'Angle Pompe 4', unit: '°', type: 'digital' },
        ]
    },
    drives: {
        title: 'Drives & Motors',
        icon: 'Cpu',
        color: 'pink',
        widgets: [
            { key: 'consigneVitesseMoteur', label: 'Consigne Vitesse', unit: 'rpm', type: 'digital' },
            { key: 'vitesseMoteurReelle', label: 'Vitesse Réelle', unit: 'rpm', type: 'digital' },
            { key: 'tempMoteurOrient2', label: 'Temp Moteur O2', unit: '°C', type: 'digital' },
            { key: 'coupleEntrainement', label: 'Couple', unit: '%', min: 0, max: 100, type: 'gauge' },
        ]
    },
    hoistCalibration: {
        title: 'Hoist Calibration',
        icon: 'Settings',
        color: 'slate',
        widgets: [
            { key: 'cu1Pzd4Hoist1Dms1P1', label: 'DMS1 P1', type: 'digital' },
            { key: 'cu1Pzd5Hoist1Dms2P1', label: 'DMS2 P1', type: 'digital' },
            { key: 'cu1Pzd6Hoist1Dms1P2', label: 'DMS1 P2', type: 'digital' },
            { key: 'cu1Pzd7Hoist1Dms2P2', label: 'DMS2 P2', type: 'digital' },
            { key: 'cu1Pzd8Hoist2Dms1P1', label: 'H2 DMS1 P1', type: 'digital' },
            { key: 'cu1Pzd9Hoist2Dms2P1', label: 'H2 DMS2 P1', type: 'digital' },
        ]
    },
    hoistTorque: {
        title: 'Hoist Torque',
        icon: 'Zap',
        color: 'yellow',
        widgets: [
            { key: 'levageCoupleAccelRapide', label: 'Accel Rapide', type: 'digital' },
            { key: 'levageCoupleFreinRapide', label: 'Frein Rapide', type: 'digital' },
            { key: 'levageCoupleAccelMoyen', label: 'Accel Moyen', type: 'digital' },
            { key: 'levageCoupleFreinMoyen', label: 'Frein Moyen', type: 'digital' },
        ]
    },
    luffingTorque: {
        title: 'Luffing Torque',
        icon: 'MoveVertical',
        color: 'violet',
        widgets: [
            { key: 'abaissCouplAccelRapide', label: 'Abaiss. Accel', type: 'digital' },
            { key: 'relevageCouplAccelRapide', label: 'Relev. Accel', type: 'digital' },
            { key: 'abaissCouplFreinRapide', label: 'Abaiss. Frein', type: 'digital' },
            { key: 'relevageCouplFreinRapide', label: 'Relev. Frein', type: 'digital' },
        ]
    },
    luffingControl: {
        title: 'Luffing Valves',
        icon: 'Settings',
        color: 'cyan',
        widgets: [
            { key: 'sollwerteDrosselTandemliftYminP', label: 'Tandem YminP', type: 'digital' },
            { key: 'sollwerteDrosselTandemliftYmaxP', label: 'Tandem YmaxP', type: 'digital' },
            { key: 'sollwerteDrosselTandemliftYminN', label: 'Tandem YminN', type: 'digital' },
            { key: 'sollwerteDrosselTandemliftYmaxN', label: 'Tandem YmaxN', type: 'digital' },
        ]
    },
    translationControl: {
        title: 'Translation Control',
        icon: 'Truck',
        color: 'fuchsia',
        widgets: [
            { key: 'consignePompeTranslRapideYminP', label: 'Pump Fast YminP', type: 'digital' },
            { key: 'consignePompeTranslRapideYmaxP', label: 'Pump Fast YmaxP', type: 'digital' },
            { key: 'consigneSoupapeTranslRapideYminP', label: 'Valve Fast YminP', type: 'digital' },
            { key: 'consigneSoupapeTranslRapideYmaxP', label: 'Valve Fast YmaxP', type: 'digital' },
        ]
    },
    grabStatus: {
        title: 'Grab Status',
        icon: 'Box',
        color: 'orange',
        widgets: [
            { key: 'motorGrabActive', label: 'Grab Active', type: 'boolean' },
            { key: 'grabCmdClose', label: 'Cmd Close', type: 'boolean' },
            { key: 'grabCmdOpen', label: 'Cmd Open', type: 'boolean' },
            { key: 'spreaderConnected', label: 'Spreader', type: 'boolean' },
        ]
    }
}

// Generate default telemetry state with all keys
export const DEFAULT_TELEMETRY = Object.keys(TAG_MAPPINGS).reduce((acc, key) => {
    // Set boolean fields
    if (['dieselEnMarche', 'kranHauptschalter', 'spreaderConnected', 'twinliftConnected',
        'containerVerrouille', 'getriebeStufeI', 'getriebeStufeII', 'getriebeStufeIII'].includes(key)) {
        acc[key] = false
    } else {
        acc[key] = 0
    }
    return acc
}, {})

// Generate simulated telemetry data
export const generateMockFullTelemetry = () => {
    const telemetry = {}
    for (const key of Object.keys(TAG_MAPPINGS)) {
        if (['dieselEnMarche', 'kranHauptschalter', 'spreaderConnected', 'twinliftConnected',
            'containerVerrouille', 'getriebeStufeI', 'getriebeStufeII', 'getriebeStufeIII'].includes(key)) {
            telemetry[key] = Math.random() > 0.5
        } else {
            telemetry[key] = Math.random() * 100 // Generic random value
        }
    }
    // Override some with realistic ranges
    telemetry.chargeNette = Math.random() * 30
    telemetry.vitesseVent = Math.random() * 15
    telemetry.niveauCarburant = 30 + Math.random() * 60
    telemetry.temperatureMoteur = 40 + Math.random() * 50
    telemetry.tempHydraulique = 35 + Math.random() * 40
    telemetry.pressionPompe = 100 + Math.random() * 200
    telemetry.heuresService = 10000 + Math.floor(Math.random() * 5000)
    telemetry.frequenceReseau = 49.5 + Math.random()
    telemetry.angleFleche = 20 + Math.random() * 60
    telemetry.porteeMetres = 10 + Math.random() * 30
    telemetry.angleOrientation = Math.random() * 360
    return telemetry
}

// Time range presets for history mode
export const TIME_RANGES = [
    { label: '1h', value: 1, unit: 'hours' },
    { label: '6h', value: 6, unit: 'hours' },
    { label: '24h', value: 24, unit: 'hours' },
    { label: '7d', value: 7, unit: 'days' },
]

// Playback speed options
export const PLAYBACK_SPEEDS = [
    { label: '1x', value: 1 },
    { label: '2x', value: 2 },
    { label: '4x', value: 4 },
    { label: '8x', value: 8 }
]
