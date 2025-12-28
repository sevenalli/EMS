import { Component, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MqttService, IMqttMessage } from 'ngx-mqtt';
import {
  ApexChart,
  ApexAxisChartSeries,
  ApexDataLabels,
  ApexFill,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexStroke,
  NgApexchartsModule
} from "ng-apexcharts";
import { NgxGaugeModule } from 'ngx-gauge';
import { ActivatedRoute } from '@angular/router';
import { HistoryPanelComponent } from '../components/history-panel/history-panel.component';
import { HistoryService, TimeRange, HistoryDataPoint } from '../services/history.service';

export type SparklineOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  stroke: ApexStroke;
  fill: ApexFill;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  colors: string[];
};

@Component({
  selector: 'app-supension',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule, NgxGaugeModule, HistoryPanelComponent],
  templateUrl: './supension.component.html',
  styleUrl: './supension.component.css',
  encapsulation: ViewEncapsulation.None
})
export class SupensionComponent implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;
  engineCode: string = '';
  currentDate: Date = new Date();

  // ===================== LOAD & SAFETY =====================
  chargeNette: number = 0;  // Radial Gauge, 0-41 t
  vitesseVent: number = 0;  // Digital Badge, 0-20 m/s
  hauteurLevageAdmissible: number = 0;  // Vertical Progress, 0-100 %
  compteurSpectre: number = 0;  // Odometer, 0-∞ SWP

  // ===================== SPEED & MOTION =====================
  vitesseMecLevage: number = 0;  // Semicircle Speedometer, -105 to 105 m/min
  vitesseOrientation: number = 0;  // Circular Gauge, 0-1.6 rpm

  // ===================== ENGINE & ENERGY =====================
  niveauCarburant: number = 0;  // Liquid Fill, 0-100 %
  temperatureMoteur: number = 0;  // Linear Thermometer, 0-110 °C
  puissanceMesuree: number = 0;  // Sparkline, 0-900 kW
  courantApparent: number = 0;  // Digital Readout, 0-400 A

  // ===================== ELECTRICAL =====================
  courantReel: number = 0;  // Sparkline/Area Chart, 0-600 A
  tensionMoteur: number = 0;  // Digital Gauge, 0-480 V
  frequenceReseau: number = 0;  // Text Readout, 58-62 Hz
  tensionReseauFreinage: number = 0;  // Bar Gauge, 0-600 V
  coupleEntrainement: number = 0;  // Radial Gauge (Torque), 0-100 %

  // ===================== TEMPERATURES =====================
  tempHuileReducteur: number = 0;  // Vertical Thermometer, 20-90 °C
  tempMoteurLevage: number = 0;  // Linear Bar, 20-110 °C
  tempMoteurOrientation: number = 0;  // Linear Bar, 20-100 °C
  tempAlternateur1: number = 0;  // Text/Mini Badge, 20-100 °C
  tempAlternateur2: number = 0;  // Text/Mini Badge, 20-100 °C

  // ===================== HYDRAULICS =====================
  tempHydraulique: number = 0;  // Circular Thermometer, 10-90 °C
  pressionPompe: number = 0;  // Pressure Gauge, 0-350 Bar
  pressionVolee: number = 0;  // Pressure Gauge, 0-400 Bar
  pressionFreinLevage: number = 0;  // Circular Pressure, 0-150 Bar
  pressionFreinOrientation: number = 0;  // Circular Pressure, 0-150 Bar
  pressionNiveau2: number = 0;  // Digital Readout, 0-300 Bar
  pressionDruckstufe7: number = 0;  // Digital Readout, 0-350 Bar
  anglePivotPompe: number = 0;  // Semi-Circle Gauge, -20 to 20 °

  // ===================== LOAD MECHANICS =====================
  coupleCharge: number = 0;  // Horizontal Bar, 0-3000 mt
  chargeBruteDMS1: number = 0;  // Data Table Row, 0-50 t
  chargeBruteDMS2: number = 0;  // Data Table Row, 0-50 t
  lastmessbolzenDMS1: number = 0;  // Line Chart, 0-4000 Raw
  lastmessbolzenDMS2: number = 0;  // Line Chart, 0-4000 Raw

  // ===================== POSITION & GEOMETRY =====================
  porteeMetres: number = 0;  // Boom radius in meters
  angleOrientation: number = 0;  // Superstructure angle
  hauteurLevage: number = 0;  // Hook height in meters
  calageAngleX: number = 0;  // Crane tilt X axis
  calageAngleY: number = 0;  // Crane tilt Y axis

  // ===================== GROSS LOAD =====================
  chargeBrute: number = 0;  // Gross load in tonnes
  chargeBruteAdmissible: number = 0;  // Max allowable gross load
  chargeBruteRelative: number = 0;  // Load percentage
  chargeNetteAdmissible: number = 0;  // Max allowable net load
  coupleChargeNominal: number = 0;  // Nominal load moment

  // ===================== SPEED LIMITS =====================
  vitesseLevageAdmissible: number = 0;  // Allowable hoist speed
  vitesseMaxiPeripherie: number = 0;  // Max peripheral speed
  vitesseMaxiGrue: number = 0;  // Max crane speed
  tempsAcceleration: number = 0;  // Acceleration time

  // ===================== CYLINDER PRESSURES =====================
  pressionVoleeTige: number = 0;  // Luffing cylinder rod side
  pressionFreinOrientation2: number = 0;  // Slewing brake 2
  consignePompe: number = 0;  // Pump setpoint
  anglePivotPompe2: number = 0;  // Pump pivot angle 2
  anglePivotPompe3: number = 0;  // Pump pivot angle 3

  // ===================== OPERATIONAL STATUS =====================
  dieselEnMarche: boolean = false;  // Diesel running
  kranHauptschalter: boolean = false;  // Main switch ON
  spreaderConnected: boolean = false;  // Spreader attached
  twinliftConnected: boolean = false;  // Twinlift attached
  containerVerrouille: boolean = false;  // Container locked

  // ===================== GEAR & TRANSMISSION =====================
  getriebeStufeI: boolean = false;  // Gear 1 (slow)
  getriebeStufeII: boolean = false;  // Gear 2 (medium)
  getriebeStufeIII: boolean = false;  // Gear 3 (fast)
  vitesseTranslationRapide: number = 0;  // Fast travel speed
  vitesseTranslationMoyenne: number = 0;  // Medium travel speed
  vitesseTranslationLente: number = 0;  // Slow travel speed

  // ===================== MAINTENANCE COUNTERS =====================
  heuresService: number = 0;  // Total service hours
  heuresDepuisEntretien: number = 0;  // Hours since last maintenance
  heuresAvantEntretien: number = 0;  // Hours until next maintenance

  // ===================== BOOM ANGLE =====================
  angleFleche: number = 0;  // Boom angle (0-90°)
  porteeCodeurAbsolu: number = 0;  // Radius from absolute encoder

  // ===================== ENGINE SENSORS =====================
  tempEauRadiateur: number = 0;  // Diesel water cooler temp
  tempAirTurbo: number = 0;  // Turbo intake air temp

  // ===================== ELECTRICAL / DRIVES =====================
  tensionBusDC: number = 0;  // DC bus voltage
  puissanceActive: number = 0;  // Active power
  consigneVitesseMoteur: number = 0;  // Motor speed setpoint (rpm)
  vitesseMoteurReelle: number = 0;  // Actual motor speed (rpm)
  tempMoteurOrient2: number = 0;  // Slewing motor 2 temp

  // ===================== ADDITIONAL HYDRAULICS =====================
  anglePivotPompe4: number = 0;  // Pump 4 pivot angle
  pressionFreinOrientation3: number = 0;  // Slewing brake 3
  pressionCapteurFondM2: number = 0;  // Luffing sensor M2 (raw)
  pressionCapteurTigeM3: number = 0;  // Luffing sensor M3 (raw)

  // ===================== HOIST TELEMETRY (Extended) =====================
  consigneManipFermeture: number = 0;  // Manipulator setpoint for closing
  consigneManipLevage: number = 0;  // Manipulator setpoint for hoisting
  pressionFreinFermeture: number = 0;  // Closing mechanism brake pressure
  chargeBruteDiffDMS12: number = 0;  // DMS 1-2 difference hoist 1
  chargeBrutePorteeMetres: number = 0;  // Gross load at radius x meters
  chargeBruteLevage2DiffDMS12: number = 0;  // DMS 1-2 difference hoist 2
  hauteurLevageAdmCalc1: number = 0;  // Allowable hoist height calc 1
  hauteurLevageAdmCalc2: number = 0;  // Allowable hoist height calc 2
  hauteurLevageAdmCalculee: number = 0;  // Calculated allowable hoist height
  consigneVitesseRotationCharge: number = 0;  // Speed setpoint based on load
  vitesseLevageAdmTMin: number = 0;  // Allowable hoist speed t/min
  rapportTransmissionRapide: number = 0;  // Fast gear transmission ratio
  betriebsdruckHW1: number = 0;  // Operating pressure HW1 brake
  betriebsdruckHW2: number = 0;  // Operating pressure HW2 brake
  lastmessbolzenHW1DMS2: number = 0;  // Load pin HW1 DMS2
  lastmessbolzenHW1DMS1: number = 0;  // Load pin HW1 DMS1
  // Hoist calibration values
  cu1Pzd4Hoist1Dms1P1: number = 0;
  cu1Pzd5Hoist1Dms2P1: number = 0;
  cu1Pzd6Hoist1Dms1P2: number = 0;
  cu1Pzd7Hoist1Dms2P2: number = 0;
  cu1Pzd8Hoist2Dms1P1: number = 0;
  cu1Pzd9Hoist2Dms2P1: number = 0;
  cu1Pzd10Hoist2Dms1P2: number = 0;
  cu1Pzd11Hoist2Dms2P2: number = 0;
  // Hoist torque values
  levageCoupleAccelRapide: number = 0;
  levageCoupleFreinRapide: number = 0;
  levageCoupleAccelMoyen: number = 0;
  levageCoupleFreinMoyen: number = 0;
  levageCoupleAccelLent: number = 0;
  levageCoupleFreinLent: number = 0;
  // Hoist DMS test load values
  apiLevage1Dms1Charge1: number = 0;
  apiLevage1Dms2Charge1: number = 0;
  apiLevage1Dms1Charge2: number = 0;
  apiLevage1Dms2Charge2: number = 0;
  apiLevage2Dms1Charge1: number = 0;
  apiLevage2Dms2Charge1: number = 0;
  apiLevage2Dms1Charge2: number = 0;
  apiLevage2Dms2Charge2: number = 0;

  // ===================== SLEW TELEMETRY (Extended) =====================
  consigneManipOrientation: number = 0;  // Manipulator setpoint for slewing
  consigneVitesseOrientPortee: number = 0;  // Speed setpoint based on radius
  betriebsdruckDrehwerk1: number = 0;  // Operating pressure slew brake 1
  consigneFixeOrientDroite: number = 0;  // Fixed setpoint jog right
  consigneFixeOrientGauche: number = 0;  // Fixed setpoint jog left

  // ===================== LUFFING TELEMETRY (Extended) =====================
  vitesseReelleCylindre: number = 0;  // Actual cylinder speed
  consigneManipVolee: number = 0;  // Manipulator setpoint for luffing
  porteeAdmissibleCharge: number = 0;  // Allowable radius based on load
  relevageCalculerPorteeAdm: number = 0;  // Raise boom - calculate allowable radius
  abaissementCalculerPorteeAdm: number = 0;  // Lower boom - calculate allowable radius
  porteeAdmRelevageCalc1: number = 0;  // Allowable radius raise calc 1
  porteeAdmRelevageCalc2: number = 0;  // Allowable radius raise calc 2
  reductionConsigneEtranglementVolee: number = 0;  // Throttle valve setpoint reduction
  pressionNiv2RelevagePorteeMin: number = 0;  // Pressure level 2 raise at min radius
  pressionNiv2RelevagePorteeMax: number = 0;  // Pressure level 2 raise at max radius
  pressionNiv3AbaissPorteeMin: number = 0;  // Pressure level 3 lower at min radius
  pressionNiv3AbaissPorteeMax: number = 0;  // Pressure level 3 lower at max radius
  pressionNiv6AbaissPorteeMinLourde: number = 0;  // Pressure level 6 lower at min radius heavy
  pressionNiv6AbaissPorteeMaxLourde: number = 0;  // Pressure level 6 lower at max radius heavy
  druckwertStufe7Wartung: number = 0;  // Pressure level 7 maintenance
  // Luffing torque values
  abaissCouplAccelRapide: number = 0;
  abaissCouplFreinRapide: number = 0;
  relevageCouplAccelRapide: number = 0;
  relevageCouplFreinRapide: number = 0;
  abaissCouplAccelMoyen: number = 0;
  abaissCouplFreinMoyen: number = 0;
  relevageCouplAccelMoyen: number = 0;
  relevageCouplFreinMoyen: number = 0;
  abaissCouplAccelLent: number = 0;
  abaissCouplFreinLent: number = 0;
  relevageCouplAccelLent: number = 0;
  relevageCouplFreinLent: number = 0;
  // Luffing valve setpoints (Tandemlift)
  sollwerteDrosselTandemliftYminP: number = 0;
  sollwerteDrosselTandemliftYmaxP: number = 0;
  sollwerteDrosselTandemliftYminN: number = 0;
  sollwerteDrosselTandemliftYmaxN: number = 0;
  // Luffing slow speed setpoints
  consignePompeVoleeLenteYminP: number = 0;
  consignePompeVoleeLenteYmaxP: number = 0;
  consignePompeVoleeLenteYminN: number = 0;
  consignePompeVoleeLenteYmaxN: number = 0;
  sollwerteDrosselLangsamYminP: number = 0;
  sollwerteDrosselLangsamYmaxP: number = 0;
  sollwerteDrosselLangsamYminN: number = 0;
  sollwerteDrosselLangsamYmaxN: number = 0;
  // Luffing personnel transport setpoints
  sollwerteDrosselPersonenYminP: number = 0;
  sollwerteDrosselPersonenYmaxP: number = 0;
  sollwerteDrosselPersonenYminN: number = 0;
  sollwerteDrosselPersonenYmaxN: number = 0;
  // Luffing medium speed setpoints
  sollwertePumpeMittelYminP: number = 0;
  sollwertePumpeMittelYmaxP: number = 0;
  sollwertePumpeMittelYminN: number = 0;
  sollwertePumpeMittelYmaxN: number = 0;
  sollwerteDrosselMittelYminP: number = 0;
  sollwerteDrosselMittelYmaxP: number = 0;
  sollwerteDrosselMittelYminN: number = 0;
  sollwerteDrosselMittelYmaxN: number = 0;
  // Luffing fast speed setpoints
  consignePompeVoleeRapideYminP: number = 0;
  consignePompeVoleeRapideYmaxP: number = 0;
  consignePompeVoleeRapideYminN: number = 0;
  consignePompeVoleeRapideYmaxN: number = 0;
  consigneEtranglementRapideYminP: number = 0;
  consigneEtranglementRapideYmaxP: number = 0;
  consigneEtranglementRapideYminN: number = 0;
  consigneEtranglementRapideYmaxN: number = 0;
  // Luffing reduction and mA values
  reductionVitesse3Mouvements: number = 0;
  mANiveau2RelevagePorteeMax: number = 0;
  mANiveau2RelevagePorteeMin: number = 0;
  mANiveau3AbaissPorteeMin: number = 0;
  mANiveau3AbaissPorteeMax: number = 0;
  mANiveau4CalageRelever: number = 0;
  mANiveau6AbaissPorteeMinLourde: number = 0;
  mANiveau6AbaissPorteeMaxLourde: number = 0;
  mANiveau7RelevageMaintenance: number = 0;

  // ===================== TRANSLATION TELEMETRY (Extended) =====================
  consigneTranslation: number = 0;  // Translation setpoint
  translationValeurConsigne: number = 0;  // Translation value setpoint
  sollwertDruckLenkpumpe1: number = 0;  // Steering pump 1 pressure cutoff
  sollwertDruckLenkpumpe2: number = 0;  // Steering pump 2 pressure cutoff
  // Translation fast speed pump setpoints
  consignePompeTranslRapideYminP: number = 0;
  consignePompeTranslRapideYmaxP: number = 0;
  consignePompeTranslRapideYminN: number = 0;
  consignePompeTranslRapideYmaxN: number = 0;
  consigneSoupapeTranslRapideYminP: number = 0;
  consigneSoupapeTranslRapideYmaxP: number = 0;
  consigneSoupapeTranslRapideYminN: number = 0;
  consigneSoupapeTranslRapideYmaxN: number = 0;
  // Translation medium speed pump setpoints
  sollwertePumpeTranslMittelYminP: number = 0;
  sollwertePumpeTranslMittelYmaxP: number = 0;
  sollwertePumpeTranslMittelYminN: number = 0;
  sollwertePumpeTranslMittelYmaxN: number = 0;
  sollwerteVentilTranslMittelYminP: number = 0;
  sollwerteVentilTranslMittelYmaxP: number = 0;
  sollwerteVentilTranslMittelYminN: number = 0;
  sollwerteVentilTranslMittelYmaxN: number = 0;
  // Translation slow speed pump setpoints
  sollwertePumpeTranslLangsamYminP: number = 0;
  sollwertePumpeTranslLangsamYmaxP: number = 0;
  sollwertePumpeTranslLangsamYminN: number = 0;
  sollwertePumpeTranslLangsamYmaxN: number = 0;
  sollwerteTranslLangsamYminP: number = 0;
  sollwerteTranslLangsamYmaxP: number = 0;
  sollwerteTranslLangsamYminN: number = 0;
  sollwerteTranslLangsamYmaxN: number = 0;

  // Thresholds
  chargeNetteThresholds = { '0': { color: '#00E396' }, '20': { color: '#FEB019' }, '30': { color: '#FF4560' } };

  // History arrays for sparklines
  puissanceHistory: number[] = [];
  courantReelHistory: number[] = [];
  dms1History: number[] = [];
  dms2History: number[] = [];
  private maxDataPoints = 30;

  // Chart options
  puissanceChartOptions: SparklineOptions | undefined;
  courantChartOptions: SparklineOptions | undefined;
  dms1ChartOptions: SparklineOptions | undefined;
  dms2ChartOptions: SparklineOptions | undefined;

  // ===================== HISTORY MODE =====================
  isHistoryMode: boolean = false;
  historyTimeRange: TimeRange | null = null;
  isLoadingHistory: boolean = false;
  historyError: string = '';

  // ===================== PLAYBACK CONTROLS =====================
  isPlaying: boolean = false;
  playbackSpeed: number = 1; // 1x, 2x, 4x, 8x speed
  playbackIndex: number = 0;
  playbackData: Map<string, HistoryDataPoint[]> = new Map();
  playbackTimestamps: Date[] = [];
  currentPlaybackTime: Date | null = null;
  private playbackInterval: any = null;

  // Complete list of all tag names for history queries (extracted from telemetry processing)
  private readonly HISTORY_TAG_NAMES = [
    // === LOAD & SAFETY ===
    'Charge_nette_en_tonnes', 'Vitesse_du_vent_valeur_reelle', 'Hauteur_de_levage_admissible_en_pourcentage', 'Compteur_spectre_de_charge_du_mec_levage',
    // === SPEED & MOTION ===
    'Vitesse_du_mec_levage_en_m_min', 'Vitesse_d_orientation_maxi_en_tr_min_reduite',
    // === ENGINE & ENERGY ===
    'Reservoir_de_carburant_diesel_niveau_de_remplissage_en', 'Temperature_du_moteur_en_degres_Celsius', 'Puissance_mesuree_en_kW', 'Courant_apparent',
    // === ELECTRICAL ===
    'Valeur_reelle_du_courant_en_A', 'Valeur_reelle_tension_moteur_en_V', 'Frequence_de_reseau', 'Tension_reseau_du_simoreg_de_freinage', 'Valeur_reelle_du_couple_venant_de_l_entrainement',
    // === TEMPERATURES ===
    'Mec_levage_1_temperature_de_l_huile_du_reducteur', 'Mec_levage_1_temperature_du_moteur_en_degres_Celsius', 'Mec_orient_1_temperature_du_moteur_en_degres_Celsius', 'Alternateur_valeur_de_temperature_1_PT100', 'Alternateur_valeur_de_temperature_2_PT100',
    // === HYDRAULICS ===
    'Temperature_du_systeme_hydraulique', 'Valeur_reelle_pression_de_pompe', 'Pression_mec_de_volee_cote_fond', 'Pression_de_service_pour_le_frein_du_mec_de_levage', 'Pression_de_service_du_frein_dorientation_1', 'Valeur_pression_pr_niv_de_press_2_en_bars', 'Druckwert_fur_Druckstufe_7_in_bar', 'Valeur_reelle_angle_de_pivotement_pompe_1',
    // === LOAD MECHANICS ===
    'Couple_de_charge_en_metres_x_tonnes', 'Charge_brute_mec_levage_1_jauge_DMS_1', 'Charge_brute_mec_levage_1_jauge_DMS_2', 'Lastmessbolzen_Hubwerk_1_DMS_1', 'Lastmessbolzen_Hubwerk_1_DMS_2',
    // === POSITION & GEOMETRY ===
    'Portee_en_metres', 'Angle_d_orientation_superstructure_chassis_valeur_reelle', 'Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu', 'Calage_angle_de_laxe_X', 'Calage_angle_de_laxe_Y',
    // === GROSS LOAD ===
    'Charge_brute_en_tonnes', 'Charge_brute_en_tonnes_admissible', 'Charge_brute_relative', 'Charge_nette_admissible_en_tonnes', 'Couple_de_charge_nominal',
    // === SPEED LIMITS ===
    'Mec_levage_vitesse_admissible_en_m_min', 'Vitesse_maxi_a_la_peripherie_en_m_min_reduite', 'Vitesse_maxi_de_la_grue_en_tr_min', 'Temps_d_acceleration_effectif_en_sec',
    // === CYLINDER PRESSURES ===
    'Pression_mec_de_volee_cote_tige', 'Pression_de_service_du_frein_dorientation_2', 'Valeur_de_consigne_pompe_hydraulique', 'Valeur_reelle_angle_de_pivotement_pompe_2', 'Valeur_reelle_angle_de_pivotement_pompe_3',
    // === OPERATIONAL STATUS ===
    'Uberwachung_Signal_Dieselmotor_in_Betrieb', 'Kranhauptschalter_ist_EIN', 'Ruckmeldung_1_Spreader_gesteckt', 'VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt', 'Ruckmeldung_Container_verriegelt',
    // === GEAR & TRANSMISSION ===
    'Hubwerk1_Getriebeumschaltung_Endstellung_Getriebestufe_I_langsam', 'Hubwerksgetriebeumschaltung_Endstellung_Getriebestufe_II_Mittel_schnell', 'Hubwerksgetriebeumschaltung_Getriebestufe_III_schnell', 'Vitesse_de_translation_rapide_m_min', 'Vitesse_de_translation_moyenne_m_min', 'Vitesse_de_translation_lente_m_min',
    // === MAINTENANCE COUNTERS ===
    'Compteur_d_heures_de_service_heures', 'Compteur_d_heures_de_service_heures_depuis_le_dernier_entretien', 'Compteur_d_heures_de_service_heures_jusqu_au_prochain_entretien',
    // === BOOM ANGLE ===
    'Angle_de_la_fleche_unite_en_degres_0_90_degres', 'Portee_en_metres_codeur_absolu',
    // === ENGINE SENSORS ===
    'Tempertur_Dieselmotor_Wasserkuhler', 'Tempertur_Dieselmotor_Ladeluft',
    // === ELECTRICAL / DRIVES ===
    'Tension_du_circuit_intermediaire_en_V', 'Puissance_en_kW', 'Valeur_de_consigne_vitesse_moteur', 'Valeur_reelle_vitesse_en_t_min', 'Mec_orient_2_temperature_du_moteur_en_degres_Celsius',
    // === ADDITIONAL HYDRAULICS ===
    'Valeur_reelle_angle_de_pivotement_pompe_4', 'Pression_de_service_du_frein_dorientation_3', 'Wippwerk_Drucksensor_Bodenseite_M2', 'Wippwerk_Drucksensor_Stangenseite_M3',
    // === HOIST TELEMETRY ===
    'Valeur_de_consigne_manipulateur_pour_fermeture', 'Valeur_de_consigne_manipulateur_pour_levage', 'Pression_de_service_pour_le_frein_du_mec_de_fermeture', 'Charge_brute_mec_levage_1_difference_jauges_DMS_1_2', 'Charge_brute_en_tonnes_en_portee_x_metres', 'Charge_brute_mec_levage_2_difference_jauges_DMS_1_2', 'Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_1', 'Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_2', 'Hauteur_de_levage_admissible_pour_le_levage_calculee', 'Calculer_valeur_consigne_vitesse_rotation_du_mec_levage_suivant_la_charge', 'Mecanisme_de_levage_vitesse_admissible_en_t_min', 'Rapport_de_transmission_reducteur_pour_mec_de_levage_vitesse_rapide', 'Betriebsdruck_HW1_Bremse', 'Betriebsdruck_HW2_Bremse', 'Lastmessbolzen_Hubwerk_1_DMS_2', 'Lastmessbolzen_Hubwerk_1_DMS_1',
    // === HOIST CALIBRATION ===
    'CU1_PZD4_Hoist1_DMS1_P1_Abgleich', 'CU1_PZD5_Hoist1_DMS2_P1_Abgleich', 'CU1_PZD6_Hoist1_DMS1_P2_Abgleich', 'CU1_PZD7_Hoist1_DMS2_P2_Abgleich', 'CU1_PZD8_Hoist2_DMS1_P1_Abgleich', 'CU1_PZD9_Hoist2_DMS2_P1_Abgleich', 'CU1_PZD10_Hoist2_DMS1_P2_Abgleich', 'CU1_PZD11_Hoist2_DMS2_P2_Abgleich',
    // === HOIST TORQUE ===
    'Levage_couple_d_acceleration_vitesse_rapide', 'Levage_couple_de_freinage_vitesse_rapide', 'Levage_couple_d_acceleration_vitesse_moyenne', 'Levage_couple_de_freinage_vitesse_moyenne', 'Levage_couple_d_acceleration_vitesse_lente', 'Levage_couple_de_freinage_vitesse_lente',
    // === HOIST DMS TEST ===
    'API_mec_levage_1_jauge_DMS_1_valeur_de_capteur_charge_dessai_1', 'API_mec_levage_1_jauge_DMS_2_valeur_de_capteur_charge_dessai_1', 'API_mec_levage_1_jauge_DMS_1_valeur_de_capteur_charge_dessai_2', 'API_mec_levage_1_jauge_DMS_2_valeur_de_capteur_charge_dessai_2', 'API_mec_levage_2_jauge_DMS_1_valeur_de_capteur_charge_dessai_1', 'API_mec_levage_2_jauge_DMS_2_valeur_de_capteur_charge_dessai_1', 'API_mec_levage_2_jauge_DMS_1_valeur_de_capteur_charge_dessai_2', 'API_mec_levage_2_jauge_DMS_2_valeur_de_capteur_charge_dessai_2',
    // === SLEW TELEMETRY ===
    'Valeur_de_consigne_manipulateur_pour_orientation', 'Calculer_val_consigne_vitesse_du_mec_orientation_suivant_la_portee', 'Betriebsdruck_Drehwerksbremse_1', 'Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_droite', 'Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_gauche',
    // === LUFFING TELEMETRY ===
    'Vitesse_reelle_du_cylindre_de_variation_de_volee', 'Valeur_de_consigne_manipulateur_pour_volee', 'Portee_regime_admissible_en_fonction_de_la_charge', 'Relevage_fleche_calculer_la_portee_admissible', 'Abaissement_fleche_calculer_la_portee_admissible', 'Portee_admissible_relevage_fleche_sans_limitation_calcul_1', 'Portee_admissible_relevage_fleche_sans_limitation_calcul_2', 'Reduction_valeur_de_consigne_de_la_soupape_detranglement_du_mec_de_volee', 'Valeur_pression_pr_niv_de_press_2_en_bars_lors_relev_fleche_en_portee_min', 'Valeur_pression_pr_niv_de_press_2_en_bars_lors_relev_fleche_en_portee_maxi', 'Valeur_pression_pr_niv_de_press_3_en_bars_lors_abaiss_fleche_en_portee_mini', 'Valeur_pression_pr_niv_de_press_3_en_bars_lors_abaiss_fleche_en_portee_maxi', 'Val_press_pr_niv_press_6_en_bars_lors_abaiss_fleche_portee_mini_charge_lourde', 'Val_press_pr_niv_press_6_en_bars_lors_abaiss_fleche_portee_maxi_charge_lourde', 'Druckwert_fur_Druckstufe_7_in_bar_fur_Ausleger_Anheben_Wartungsbetrieb',
    // === LUFFING TORQUE ===
    'Abaisser_la_fleche_couple_d_acceleration_vitesse_rapide', 'Abaisser_la_fleche_couple_de_freinage_vitesse_rapide', 'Relevage_de_la_fleche_couple_d_acceleration_vitesse_rapide', 'Relevage_de_la_fleche_couple_de_freinage_vitesse_rapide', 'Abaisser_la_fleche_couple_d_acceleration_vitesse_moyenne', 'Abaisser_la_fleche_couple_de_freinage_vitesse_moyenne', 'Relevage_de_la_fleche_couple_d_acceleration_vitesse_moyenne', 'Relevage_de_la_fleche_couple_de_freinage_vitesse_moyenne', 'Abaisser_la_fleche_couple_d_acceleration_vitesse_lente', 'Abaisser_la_fleche_couple_de_freinage_vitesse_lente', 'Relevage_de_la_fleche_couple_d_acceleration_vitesse_lente', 'Relevage_de_la_fleche_couple_de_freinage_vitesse_lente',
    // === LUFFING VALVE SETPOINTS ===
    'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINP', 'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXP', 'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINN', 'Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXN', 'Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMINP', 'Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMAXP', 'Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMINN', 'Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMAXN', 'Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMINP', 'Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMAXP', 'Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMINN', 'Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMAXN', 'Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMINP', 'Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMAXP', 'Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMINN', 'Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMAXN', 'Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMINP', 'Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMAXP', 'Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMINN', 'Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMAXN', 'Sollwerte_Drosselventil_mittlere_Wippstufe_YMINP', 'Sollwerte_Drosselventil_mittlere_Wippstufe_YMAXP', 'Sollwerte_Drosselventil_mittlere_Wippstufe_YMINN', 'Sollwerte_Drosselventil_mittlere_Wippstufe_YMAXN', 'Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMINP', 'Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMAXP', 'Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMINN', 'Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMAXN', 'Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMINP', 'Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMAXP', 'Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMINN', 'Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMAXN',
    // === LUFFING MA VALUES ===
    'Reduction_vitesse_var_de_volee_lors_du_relevage_de_fleche_et_trois_mouvements', 'mA_pour_niveau_de_pression_2_xxx_bars_relevage_de_fleche_en_portee_maxi', 'mA_pour_niveau_de_pression_2_xxx_bars_relevage_de_fleche_en_portee_min', 'mA_pour_niveau_de_pression_3_xxx_bars_abaissement_de_fleche_en_portee_mini', 'mA_pour_niveau_de_pression_3_xxx_bars_abaissement_de_fleche_en_portee_maxi', 'mA_pour_pression_4_280_bars_calage_relever_fleche', 'mA_pr_niveau_press_6_xxx_bars_abaissement_fleche_en_portee_mini_charge_lourde', 'mA_pr_niveau_press_6_xxx_bars_abaissement_fleche_en_portee_maxi_charge_lourde', 'mA_pr_niveau_press_7_xxx_bars_relevage_fleche_mode_entretien',
    // === TRANSLATION TELEMETRY ===
    'Valeur_de_consigne_translation', 'Translation_valeur_de_consigne', 'Sollwert_Druckabschneidung_Lenkpumpe_1', 'Sollwert_Druckabschneidung_Lenkpumpe_2', 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINP', 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXP', 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINN', 'Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXN', 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINP', 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXP', 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINN', 'Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXN', 'Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMINP', 'Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMAXP', 'Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMINN', 'Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMAXN', 'Sollwerte_fur_Fahren_Ventil_mittel_YMINP', 'Sollwerte_fur_Fahren_Ventil_mittel_YMAXP', 'Sollwerte_fur_Fahren_Ventil_mittel_YMINN', 'Sollwerte_fur_Fahren_Ventil_mittel_YMAXN', 'Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMINP', 'Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMAXP', 'Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMINN', 'Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMAXN', 'Sollwerte_fur_Fahren_langsam_YMINP', 'Sollwerte_fur_Fahren_langsam_YMAXP', 'Sollwerte_fur_Fahren_langsam_YMINN', 'Sollwerte_fur_Fahren_langsam_YMAXN'
  ];

  constructor(
    private route: ActivatedRoute,
    private _mqttService: MqttService,
    private cdr: ChangeDetectorRef,
    private historyService: HistoryService
  ) {
    this.initCharts();
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.engineCode = params.get('engineCode') || '';
    });
    this.connectToTelemetry();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
    this.stopPlayback();
  }

  // ===================== HISTORY MODE METHODS =====================
  onModeChange(mode: 'live' | 'history'): void {
    this.isHistoryMode = mode === 'history';
    this.historyError = '';

    if (this.isHistoryMode) {
      // Pause live updates when in history mode
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    } else {
      // Stop playback and resume live updates when switching back
      this.stopPlayback();
      this.connectToTelemetry();
    }
  }

  onTimeRangeChange(range: TimeRange): void {
    this.historyTimeRange = range;
    if (this.isHistoryMode) {
      this.fetchHistoricalData();
    }
  }

  fetchHistoricalData(): void {
    if (!this.historyTimeRange) return;

    this.isLoadingHistory = true;
    this.historyError = '';
    this.stopPlayback();

    this.historyService.getTagHistory(
      this.HISTORY_TAG_NAMES,
      this.historyTimeRange.startTime,
      this.historyTimeRange.endTime,
      10000 // Get more data points for smoother playback
    ).subscribe({
      next: (response) => {
        this.isLoadingHistory = false;
        if (response.data.length === 0) {
          this.historyError = 'No data found for the selected time range';
          return;
        }

        // Group data by tag name and prepare for playback
        this.playbackData = this.historyService.groupByTagName(response.data);

        // Extract unique timestamps and sort them
        const allTimestamps = new Set<string>();
        this.playbackData.forEach(points => {
          points.forEach(p => allTimestamps.add(p.ts));
        });
        this.playbackTimestamps = Array.from(allTimestamps)
          .map(ts => new Date(ts))
          .sort((a, b) => a.getTime() - b.getTime());

        // Start at the beginning
        this.playbackIndex = 0;
        this.updatePlaybackFrame();

        // Auto-start playback
        this.startPlayback();

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingHistory = false;
        this.historyError = 'Failed to fetch historical data. Make sure the API server is running.';
        console.error('History fetch error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  // ===================== PLAYBACK CONTROLS =====================
  startPlayback(): void {
    if (this.playbackTimestamps.length === 0) return;
    this.isPlaying = true;
    const intervalMs = 1000 / this.playbackSpeed; // 1 second per frame at 1x speed
    this.playbackInterval = setInterval(() => {
      this.nextFrame();
    }, intervalMs);
  }

  stopPlayback(): void {
    this.isPlaying = false;
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  togglePlayback(): void {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      this.stopPlayback();
      this.startPlayback();
    }
  }

  nextFrame(): void {
    if (this.playbackTimestamps.length === 0) return;
    this.playbackIndex = (this.playbackIndex + 1) % this.playbackTimestamps.length;
    this.updatePlaybackFrame();
  }

  prevFrame(): void {
    if (this.playbackTimestamps.length === 0) return;
    this.playbackIndex = this.playbackIndex <= 0
      ? this.playbackTimestamps.length - 1
      : this.playbackIndex - 1;
    this.updatePlaybackFrame();
  }

  seekTo(index: number): void {
    if (index >= 0 && index < this.playbackTimestamps.length) {
      this.playbackIndex = index;
      this.updatePlaybackFrame();
    }
  }

  updatePlaybackFrame(): void {
    if (this.playbackTimestamps.length === 0) return;

    this.currentPlaybackTime = this.playbackTimestamps[this.playbackIndex];
    const targetTime = this.currentPlaybackTime.getTime();

    // Find the closest data point for each tag at or before the current time
    this.playbackData.forEach((points, tagName) => {
      // Find the point closest to the current playback time
      let closestPoint: HistoryDataPoint | null = null;
      let minDiff = Infinity;

      for (const point of points) {
        const pointTime = new Date(point.ts).getTime();
        const diff = Math.abs(pointTime - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestPoint = point;
        }
      }

      if (closestPoint) {
        this.updateValueFromPoint(tagName, closestPoint.value);
      }
    });

    this.updateCharts();
    this.cdr.detectChanges();
  }

  updateValueFromPoint(tagName: string, valueStr: string): void {
    // Handle boolean values
    if (valueStr === 'true' || valueStr === 'false' || valueStr === '1' || valueStr === '0') {
      const boolValue = valueStr === 'true' || valueStr === '1';
      switch (tagName) {
        case 'Uberwachung_Signal_Dieselmotor_in_Betrieb': this.dieselEnMarche = boolValue; break;
        case 'Kranhauptschalter_ist_EIN': this.kranHauptschalter = boolValue; break;
        case 'Ruckmeldung_1_Spreader_gesteckt': this.spreaderConnected = boolValue; break;
        case 'VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt': this.twinliftConnected = boolValue; break;
        case 'Ruckmeldung_Container_verriegelt': this.containerVerrouille = boolValue; break;
        case 'Hubwerk1_Getriebeumschaltung_Endstellung_Getriebestufe_I_langsam': this.getriebeStufeI = boolValue; break;
        case 'Hubwerksgetriebeumschaltung_Endstellung_Getriebestufe_II_Mittel_schnell': this.getriebeStufeII = boolValue; break;
        case 'Hubwerksgetriebeumschaltung_Getriebestufe_III_schnell': this.getriebeStufeIII = boolValue; break;
      }
      return;
    }

    // Handle numeric values
    const value = parseFloat(valueStr);
    if (isNaN(value)) return;

    switch (tagName) {
      // LOAD & SAFETY
      case 'Charge_nette_en_tonnes': this.chargeNette = value; break;
      case 'Vitesse_du_vent_valeur_reelle': this.vitesseVent = value; break;
      case 'Hauteur_de_levage_admissible_en_pourcentage': this.hauteurLevageAdmissible = value; break;
      case 'Compteur_spectre_de_charge_du_mec_levage': this.compteurSpectre = value; break;
      // SPEED & MOTION
      case 'Vitesse_du_mec_levage_en_m_min': this.vitesseMecLevage = value; break;
      case 'Vitesse_d_orientation_maxi_en_tr_min_reduite': this.vitesseOrientation = value; break;
      // ENGINE & ENERGY
      case 'Reservoir_de_carburant_diesel_niveau_de_remplissage_en': this.niveauCarburant = value; break;
      case 'Temperature_du_moteur_en_degres_Celsius': this.temperatureMoteur = value; break;
      case 'Puissance_mesuree_en_kW': this.puissanceMesuree = value; this.addToHistory(this.puissanceHistory, value); break;
      case 'Courant_apparent': this.courantApparent = value; break;
      // ELECTRICAL
      case 'Valeur_reelle_du_courant_en_A': this.courantReel = value; this.addToHistory(this.courantReelHistory, value); break;
      case 'Valeur_reelle_tension_moteur_en_V': this.tensionMoteur = value; break;
      case 'Frequence_de_reseau': this.frequenceReseau = value; break;
      case 'Tension_reseau_du_simoreg_de_freinage': this.tensionReseauFreinage = value; break;
      case 'Valeur_reelle_du_couple_venant_de_l_entrainement': this.coupleEntrainement = value; break;
      // TEMPERATURES
      case 'Mec_levage_1_temperature_de_l_huile_du_reducteur': this.tempHuileReducteur = value; break;
      case 'Mec_levage_1_temperature_du_moteur_en_degres_Celsius': this.tempMoteurLevage = value; break;
      case 'Mec_orient_1_temperature_du_moteur_en_degres_Celsius': this.tempMoteurOrientation = value; break;
      case 'Alternateur_valeur_de_temperature_1_PT100': this.tempAlternateur1 = value; break;
      case 'Alternateur_valeur_de_temperature_2_PT100': this.tempAlternateur2 = value; break;
      // HYDRAULICS
      case 'Temperature_du_systeme_hydraulique': this.tempHydraulique = value; break;
      case 'Valeur_reelle_pression_de_pompe': this.pressionPompe = value; break;
      case 'Pression_mec_de_volee_cote_fond': this.pressionVolee = value; break;
      case 'Pression_de_service_pour_le_frein_du_mec_de_levage': this.pressionFreinLevage = value; break;
      case 'Pression_de_service_du_frein_dorientation_1': this.pressionFreinOrientation = value; break;
      case 'Valeur_pression_pr_niv_de_press_2_en_bars': this.pressionNiveau2 = value; break;
      case 'Druckwert_fur_Druckstufe_7_in_bar': this.pressionDruckstufe7 = value; break;
      case 'Valeur_reelle_angle_de_pivotement_pompe_1': this.anglePivotPompe = value; break;
      // LOAD MECHANICS
      case 'Couple_de_charge_en_metres_x_tonnes': this.coupleCharge = value; break;
      case 'Charge_brute_mec_levage_1_jauge_DMS_1': this.chargeBruteDMS1 = value; break;
      case 'Charge_brute_mec_levage_1_jauge_DMS_2': this.chargeBruteDMS2 = value; break;
      case 'Lastmessbolzen_Hubwerk_1_DMS_1': this.lastmessbolzenDMS1 = value; this.addToHistory(this.dms1History, value); break;
      case 'Lastmessbolzen_Hubwerk_1_DMS_2': this.lastmessbolzenDMS2 = value; this.addToHistory(this.dms2History, value); break;
      // POSITION & GEOMETRY
      case 'Portee_en_metres': this.porteeMetres = value; break;
      case 'Angle_d_orientation_superstructure_chassis_valeur_reelle': this.angleOrientation = value; break;
      case 'Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu': this.hauteurLevage = value; break;
      case 'Calage_angle_de_laxe_X': this.calageAngleX = value; break;
      case 'Calage_angle_de_laxe_Y': this.calageAngleY = value; break;
      // GROSS LOAD
      case 'Charge_brute_en_tonnes': this.chargeBrute = value; break;
      case 'Charge_brute_en_tonnes_admissible': this.chargeBruteAdmissible = value; break;
      case 'Charge_brute_relative': this.chargeBruteRelative = value; break;
      case 'Charge_nette_admissible_en_tonnes': this.chargeNetteAdmissible = value; break;
      case 'Couple_de_charge_nominal': this.coupleChargeNominal = value; break;
      // SPEED LIMITS
      case 'Mec_levage_vitesse_admissible_en_m_min': this.vitesseLevageAdmissible = value; break;
      case 'Vitesse_maxi_a_la_peripherie_en_m_min_reduite': this.vitesseMaxiPeripherie = value; break;
      case 'Vitesse_maxi_de_la_grue_en_tr_min': this.vitesseMaxiGrue = value; break;
      case 'Temps_d_acceleration_effectif_en_sec': this.tempsAcceleration = value; break;
      // CYLINDER PRESSURES
      case 'Pression_mec_de_volee_cote_tige': this.pressionVoleeTige = value; break;
      case 'Pression_de_service_du_frein_dorientation_2': this.pressionFreinOrientation2 = value; break;
      case 'Valeur_de_consigne_pompe_hydraulique': this.consignePompe = value; break;
      case 'Valeur_reelle_angle_de_pivotement_pompe_2': this.anglePivotPompe2 = value; break;
      case 'Valeur_reelle_angle_de_pivotement_pompe_3': this.anglePivotPompe3 = value; break;
      // MAINTENANCE COUNTERS
      case 'Compteur_d_heures_de_service_heures': this.heuresService = value; break;
      case 'Compteur_d_heures_de_service_heures_depuis_le_dernier_entretien': this.heuresDepuisEntretien = value; break;
      case 'Compteur_d_heures_de_service_heures_jusqu_au_prochain_entretien': this.heuresAvantEntretien = value; break;
      // BOOM ANGLE
      case 'Angle_de_la_fleche_unite_en_degres_0_90_degres': this.angleFleche = value; break;
      case 'Portee_en_metres_codeur_absolu': this.porteeCodeurAbsolu = value; break;
      // ENGINE SENSORS
      case 'Tempertur_Dieselmotor_Wasserkuhler': this.tempEauRadiateur = value; break;
      case 'Tempertur_Dieselmotor_Ladeluft': this.tempAirTurbo = value; break;
      // ELECTRICAL / DRIVES
      case 'Tension_du_circuit_intermediaire_en_V': this.tensionBusDC = value; break;
      case 'Puissance_en_kW': this.puissanceActive = value; break;
      case 'Valeur_de_consigne_vitesse_moteur': this.consigneVitesseMoteur = value; break;
      case 'Valeur_reelle_vitesse_en_t_min': this.vitesseMoteurReelle = value; break;
      case 'Mec_orient_2_temperature_du_moteur_en_degres_Celsius': this.tempMoteurOrient2 = value; break;
      // GEAR & TRANSMISSION SPEEDS
      case 'Vitesse_de_translation_rapide_m_min': this.vitesseTranslationRapide = value; break;
      case 'Vitesse_de_translation_moyenne_m_min': this.vitesseTranslationMoyenne = value; break;
      case 'Vitesse_de_translation_lente_m_min': this.vitesseTranslationLente = value; break;
    }
  }

  getPlaybackProgress(): number {
    if (this.playbackTimestamps.length === 0) return 0;
    return (this.playbackIndex / (this.playbackTimestamps.length - 1)) * 100;
  }

  updateChartsWithHistoricalData(grouped: Map<string, HistoryDataPoint[]>): void {
    // Update power chart
    const powerData = grouped.get('Puissance_mesuree_en_kW');
    if (powerData) {
      this.puissanceHistory = powerData.map(d => parseFloat(d.value) || 0);
      this.updateCharts();
    }

    // Update current chart
    const currentData = grouped.get('Valeur_reelle_du_courant_en_A');
    if (currentData) {
      this.courantReelHistory = currentData.map(d => parseFloat(d.value) || 0);
      this.updateCharts();
    }
  }

  updateValuesFromHistory(grouped: Map<string, HistoryDataPoint[]>): void {
    // Get the most recent value for each tag
    grouped.forEach((points, tagName) => {
      if (points.length === 0) return;
      const latestPoint = points[points.length - 1];
      const value = parseFloat(latestPoint.value);

      if (isNaN(value)) return;

      switch (tagName) {
        case 'Charge_nette_en_tonnes':
          this.chargeNette = value;
          break;
        case 'Vitesse_du_vent_valeur_reelle':
          this.vitesseVent = value;
          break;
        case 'Puissance_mesuree_en_kW':
          this.puissanceMesuree = value;
          break;
        case 'Valeur_reelle_du_courant_en_A':
          this.courantReel = value;
          break;
        case 'Temperature_du_moteur_en_degres_Celsius':
          this.temperatureMoteur = value;
          break;
        case 'Portee_en_metres':
          this.porteeMetres = value;
          break;
        case 'Angle_d_orientation_superstructure_chassis_valeur_reelle':
          this.angleOrientation = value;
          break;
        case 'Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu':
          this.hauteurLevage = value;
          break;
      }
    });
  }

  connectToTelemetry(): void {
    try {
      this.subscription = this._mqttService.observe('site/pi5/generator/snapshot').subscribe({
        next: (message: IMqttMessage) => {
          try {
            const parsed = JSON.parse(message.payload.toString());
            const data = parsed.data || parsed;
            const timestamp = parsed.ts || null;
            this.updateFromTelemetry(data, timestamp);
          } catch (e) { console.error('Parse error', e); }
        },
        error: (error: any) => console.error('MQTT error:', error)
      });
    } catch (e) { console.error('MQTT connect error:', e); }
  }

  updateFromTelemetry(data: any, timestamp?: string): void {
    this.currentDate = timestamp ? new Date(timestamp) : new Date();

    // LOAD & SAFETY
    if (data.Charge_nette_en_tonnes !== undefined) this.chargeNette = Number(data.Charge_nette_en_tonnes);
    if (data.Vitesse_du_vent_valeur_reelle !== undefined) this.vitesseVent = Number(data.Vitesse_du_vent_valeur_reelle);
    if (data.Hauteur_de_levage_admissible_en_pourcentage !== undefined) this.hauteurLevageAdmissible = Number(data.Hauteur_de_levage_admissible_en_pourcentage);
    if (data.Compteur_spectre_de_charge_du_mec_levage !== undefined) this.compteurSpectre = Number(data.Compteur_spectre_de_charge_du_mec_levage);

    // SPEED & MOTION
    if (data.Vitesse_du_mec_levage_en_m_min !== undefined) this.vitesseMecLevage = Number(data.Vitesse_du_mec_levage_en_m_min);
    if (data.Vitesse_d_orientation_maxi_en_tr_min_reduite !== undefined) this.vitesseOrientation = Number(data.Vitesse_d_orientation_maxi_en_tr_min_reduite);

    // ENGINE & ENERGY
    if (data.Reservoir_de_carburant_diesel_niveau_de_remplissage_en !== undefined) this.niveauCarburant = Number(data.Reservoir_de_carburant_diesel_niveau_de_remplissage_en);
    if (data.Temperature_du_moteur_en_degres_Celsius !== undefined) this.temperatureMoteur = Number(data.Temperature_du_moteur_en_degres_Celsius);
    if (data.Puissance_mesuree_en_kW !== undefined) { this.puissanceMesuree = Number(data.Puissance_mesuree_en_kW); this.addToHistory(this.puissanceHistory, this.puissanceMesuree); }
    if (data.Courant_apparent !== undefined) this.courantApparent = Number(data.Courant_apparent);

    // ELECTRICAL
    if (data.Valeur_reelle_du_courant_en_A !== undefined) { this.courantReel = Number(data.Valeur_reelle_du_courant_en_A); this.addToHistory(this.courantReelHistory, this.courantReel); }
    if (data.Valeur_reelle_tension_moteur_en_V !== undefined) this.tensionMoteur = Number(data.Valeur_reelle_tension_moteur_en_V);
    if (data.Frequence_de_reseau !== undefined) this.frequenceReseau = Number(data.Frequence_de_reseau);
    if (data.Tension_reseau_du_simoreg_de_freinage !== undefined) this.tensionReseauFreinage = Number(data.Tension_reseau_du_simoreg_de_freinage);
    if (data.Valeur_reelle_du_couple_venant_de_l_entrainement !== undefined) this.coupleEntrainement = Number(data.Valeur_reelle_du_couple_venant_de_l_entrainement);

    // TEMPERATURES
    if (data.Mec_levage_1_temperature_de_l_huile_du_reducteur !== undefined) this.tempHuileReducteur = Number(data.Mec_levage_1_temperature_de_l_huile_du_reducteur);
    if (data.Mec_levage_1_temperature_du_moteur_en_degres_Celsius !== undefined) this.tempMoteurLevage = Number(data.Mec_levage_1_temperature_du_moteur_en_degres_Celsius);
    if (data.Mec_orient_1_temperature_du_moteur_en_degres_Celsius !== undefined) this.tempMoteurOrientation = Number(data.Mec_orient_1_temperature_du_moteur_en_degres_Celsius);
    if (data.Alternateur_valeur_de_temperature_1_PT100 !== undefined) this.tempAlternateur1 = Number(data.Alternateur_valeur_de_temperature_1_PT100);
    if (data.Alternateur_valeur_de_temperature_2_PT100 !== undefined) this.tempAlternateur2 = Number(data.Alternateur_valeur_de_temperature_2_PT100);

    // HYDRAULICS
    if (data.Temperature_du_systeme_hydraulique !== undefined) this.tempHydraulique = Number(data.Temperature_du_systeme_hydraulique);
    if (data.Valeur_reelle_pression_de_pompe !== undefined) this.pressionPompe = Number(data.Valeur_reelle_pression_de_pompe);
    if (data.Pression_mec_de_volee_cote_fond !== undefined) this.pressionVolee = Number(data.Pression_mec_de_volee_cote_fond);
    if (data.Pression_de_service_pour_le_frein_du_mec_de_levage !== undefined) this.pressionFreinLevage = Number(data.Pression_de_service_pour_le_frein_du_mec_de_levage);
    if (data.Pression_de_service_du_frein_dorientation_1 !== undefined) this.pressionFreinOrientation = Number(data.Pression_de_service_du_frein_dorientation_1);
    if (data.Valeur_pression_pr_niv_de_press_2_en_bars !== undefined) this.pressionNiveau2 = Number(data.Valeur_pression_pr_niv_de_press_2_en_bars);
    if (data.Druckwert_fur_Druckstufe_7_in_bar !== undefined) this.pressionDruckstufe7 = Number(data.Druckwert_fur_Druckstufe_7_in_bar);
    if (data.Valeur_reelle_angle_de_pivotement_pompe_1 !== undefined) this.anglePivotPompe = Number(data.Valeur_reelle_angle_de_pivotement_pompe_1);

    // LOAD MECHANICS
    if (data.Couple_de_charge_en_metres_x_tonnes !== undefined) this.coupleCharge = Number(data.Couple_de_charge_en_metres_x_tonnes);
    if (data.Charge_brute_mec_levage_1_jauge_DMS_1 !== undefined) this.chargeBruteDMS1 = Number(data.Charge_brute_mec_levage_1_jauge_DMS_1);
    if (data.Charge_brute_mec_levage_1_jauge_DMS_2 !== undefined) this.chargeBruteDMS2 = Number(data.Charge_brute_mec_levage_1_jauge_DMS_2);
    if (data.Lastmessbolzen_Hubwerk_1_DMS_1 !== undefined) { this.lastmessbolzenDMS1 = Number(data.Lastmessbolzen_Hubwerk_1_DMS_1); this.addToHistory(this.dms1History, this.lastmessbolzenDMS1); }
    if (data.Lastmessbolzen_Hubwerk_1_DMS_2 !== undefined) { this.lastmessbolzenDMS2 = Number(data.Lastmessbolzen_Hubwerk_1_DMS_2); this.addToHistory(this.dms2History, this.lastmessbolzenDMS2); }

    // POSITION & GEOMETRY
    if (data.Portee_en_metres !== undefined) this.porteeMetres = Number(data.Portee_en_metres);
    if (data.Angle_d_orientation_superstructure_chassis_valeur_reelle !== undefined) this.angleOrientation = Number(data.Angle_d_orientation_superstructure_chassis_valeur_reelle);
    if (data.Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu !== undefined) this.hauteurLevage = Number(data.Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu);
    if (data.Calage_angle_de_laxe_X !== undefined) this.calageAngleX = Number(data.Calage_angle_de_laxe_X);
    if (data.Calage_angle_de_laxe_Y !== undefined) this.calageAngleY = Number(data.Calage_angle_de_laxe_Y);

    // GROSS LOAD
    if (data.Charge_brute_en_tonnes !== undefined) this.chargeBrute = Number(data.Charge_brute_en_tonnes);
    if (data.Charge_brute_en_tonnes_admissible !== undefined) this.chargeBruteAdmissible = Number(data.Charge_brute_en_tonnes_admissible);
    if (data.Charge_brute_relative !== undefined) this.chargeBruteRelative = Number(data.Charge_brute_relative);
    if (data.Charge_nette_admissible_en_tonnes !== undefined) this.chargeNetteAdmissible = Number(data.Charge_nette_admissible_en_tonnes);
    if (data.Couple_de_charge_nominal !== undefined) this.coupleChargeNominal = Number(data.Couple_de_charge_nominal);

    // SPEED LIMITS
    if (data.Mec_levage_vitesse_admissible_en_m_min !== undefined) this.vitesseLevageAdmissible = Number(data.Mec_levage_vitesse_admissible_en_m_min);
    if (data.Vitesse_maxi_a_la_peripherie_en_m_min_reduite !== undefined) this.vitesseMaxiPeripherie = Number(data.Vitesse_maxi_a_la_peripherie_en_m_min_reduite);
    if (data.Vitesse_maxi_de_la_grue_en_tr_min !== undefined) this.vitesseMaxiGrue = Number(data.Vitesse_maxi_de_la_grue_en_tr_min);
    if (data.Temps_d_acceleration_effectif_en_sec !== undefined) this.tempsAcceleration = Number(data.Temps_d_acceleration_effectif_en_sec);

    // CYLINDER PRESSURES
    if (data.Pression_mec_de_volee_cote_tige !== undefined) this.pressionVoleeTige = Number(data.Pression_mec_de_volee_cote_tige);
    if (data.Pression_de_service_du_frein_dorientation_2 !== undefined) this.pressionFreinOrientation2 = Number(data.Pression_de_service_du_frein_dorientation_2);
    if (data.Valeur_de_consigne_pompe_hydraulique !== undefined) this.consignePompe = Number(data.Valeur_de_consigne_pompe_hydraulique);
    if (data.Valeur_reelle_angle_de_pivotement_pompe_2 !== undefined) this.anglePivotPompe2 = Number(data.Valeur_reelle_angle_de_pivotement_pompe_2);
    if (data.Valeur_reelle_angle_de_pivotement_pompe_3 !== undefined) this.anglePivotPompe3 = Number(data.Valeur_reelle_angle_de_pivotement_pompe_3);

    // OPERATIONAL STATUS
    if (data.Uberwachung_Signal_Dieselmotor_in_Betrieb !== undefined) this.dieselEnMarche = Boolean(data.Uberwachung_Signal_Dieselmotor_in_Betrieb);
    if (data.Kranhauptschalter_ist_EIN !== undefined) this.kranHauptschalter = Boolean(data.Kranhauptschalter_ist_EIN);
    if (data.Ruckmeldung_1_Spreader_gesteckt !== undefined) this.spreaderConnected = Boolean(data.Ruckmeldung_1_Spreader_gesteckt);
    if (data.VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt !== undefined) this.twinliftConnected = Boolean(data.VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt);
    if (data.Ruckmeldung_Container_verriegelt !== undefined) this.containerVerrouille = Boolean(data.Ruckmeldung_Container_verriegelt);

    // GEAR & TRANSMISSION
    if (data.Hubwerk1_Getriebeumschaltung_Endstellung_Getriebestufe_I_langsam !== undefined) this.getriebeStufeI = Boolean(data.Hubwerk1_Getriebeumschaltung_Endstellung_Getriebestufe_I_langsam);
    if (data.Hubwerksgetriebeumschaltung_Endstellung_Getriebestufe_II_Mittel_schnell !== undefined) this.getriebeStufeII = Boolean(data.Hubwerksgetriebeumschaltung_Endstellung_Getriebestufe_II_Mittel_schnell);
    if (data.Hubwerksgetriebeumschaltung_Getriebestufe_III_schnell !== undefined) this.getriebeStufeIII = Boolean(data.Hubwerksgetriebeumschaltung_Getriebestufe_III_schnell);
    if (data.Vitesse_de_translation_rapide_m_min !== undefined) this.vitesseTranslationRapide = Number(data.Vitesse_de_translation_rapide_m_min);
    if (data.Vitesse_de_translation_moyenne_m_min !== undefined) this.vitesseTranslationMoyenne = Number(data.Vitesse_de_translation_moyenne_m_min);
    if (data.Vitesse_de_translation_lente_m_min !== undefined) this.vitesseTranslationLente = Number(data.Vitesse_de_translation_lente_m_min);

    // MAINTENANCE COUNTERS
    if (data.Compteur_d_heures_de_service_heures !== undefined) this.heuresService = Number(data.Compteur_d_heures_de_service_heures);
    if (data.Compteur_d_heures_de_service_heures_depuis_le_dernier_entretien !== undefined) this.heuresDepuisEntretien = Number(data.Compteur_d_heures_de_service_heures_depuis_le_dernier_entretien);
    if (data.Compteur_d_heures_de_service_heures_jusqu_au_prochain_entretien !== undefined) this.heuresAvantEntretien = Number(data.Compteur_d_heures_de_service_heures_jusqu_au_prochain_entretien);

    // BOOM ANGLE
    if (data.Angle_de_la_fleche_unite_en_degres_0_90_degres !== undefined) this.angleFleche = Number(data.Angle_de_la_fleche_unite_en_degres_0_90_degres);
    if (data.Portee_en_metres_codeur_absolu !== undefined) this.porteeCodeurAbsolu = Number(data.Portee_en_metres_codeur_absolu);

    // ENGINE SENSORS
    if (data.Tempertur_Dieselmotor_Wasserkuhler !== undefined) this.tempEauRadiateur = Number(data.Tempertur_Dieselmotor_Wasserkuhler);
    if (data.Tempertur_Dieselmotor_Ladeluft !== undefined) this.tempAirTurbo = Number(data.Tempertur_Dieselmotor_Ladeluft);

    // ELECTRICAL / DRIVES
    if (data.Tension_du_circuit_intermediaire_en_V !== undefined) this.tensionBusDC = Number(data.Tension_du_circuit_intermediaire_en_V);
    if (data.Puissance_en_kW !== undefined) this.puissanceActive = Number(data.Puissance_en_kW);
    if (data.Valeur_de_consigne_vitesse_moteur !== undefined) this.consigneVitesseMoteur = Number(data.Valeur_de_consigne_vitesse_moteur);
    if (data.Valeur_reelle_vitesse_en_t_min !== undefined) this.vitesseMoteurReelle = Number(data.Valeur_reelle_vitesse_en_t_min);
    if (data.Mec_orient_2_temperature_du_moteur_en_degres_Celsius !== undefined) this.tempMoteurOrient2 = Number(data.Mec_orient_2_temperature_du_moteur_en_degres_Celsius);

    // ADDITIONAL HYDRAULICS
    if (data.Valeur_reelle_angle_de_pivotement_pompe_4 !== undefined) this.anglePivotPompe4 = Number(data.Valeur_reelle_angle_de_pivotement_pompe_4);
    if (data.Pression_de_service_du_frein_dorientation_3 !== undefined) this.pressionFreinOrientation3 = Number(data.Pression_de_service_du_frein_dorientation_3);
    if (data.Wippwerk_Drucksensor_Bodenseite_M2 !== undefined) this.pressionCapteurFondM2 = Number(data.Wippwerk_Drucksensor_Bodenseite_M2);
    if (data.Wippwerk_Drucksensor_Stangenseite_M3 !== undefined) this.pressionCapteurTigeM3 = Number(data.Wippwerk_Drucksensor_Stangenseite_M3);

    // HOIST TELEMETRY (Extended)
    if (data.Valeur_de_consigne_manipulateur_pour_fermeture !== undefined) this.consigneManipFermeture = Number(data.Valeur_de_consigne_manipulateur_pour_fermeture);
    if (data.Valeur_de_consigne_manipulateur_pour_levage !== undefined) this.consigneManipLevage = Number(data.Valeur_de_consigne_manipulateur_pour_levage);
    if (data.Pression_de_service_pour_le_frein_du_mec_de_fermeture !== undefined) this.pressionFreinFermeture = Number(data.Pression_de_service_pour_le_frein_du_mec_de_fermeture);
    if (data.Charge_brute_mec_levage_1_difference_jauges_DMS_1_2 !== undefined) this.chargeBruteDiffDMS12 = Number(data.Charge_brute_mec_levage_1_difference_jauges_DMS_1_2);
    if (data.Charge_brute_en_tonnes_en_portee_x_metres !== undefined) this.chargeBrutePorteeMetres = Number(data.Charge_brute_en_tonnes_en_portee_x_metres);
    if (data.Charge_brute_mec_levage_2_difference_jauges_DMS_1_2 !== undefined) this.chargeBruteLevage2DiffDMS12 = Number(data.Charge_brute_mec_levage_2_difference_jauges_DMS_1_2);
    if (data.Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_1 !== undefined) this.hauteurLevageAdmCalc1 = Number(data.Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_1);
    if (data.Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_2 !== undefined) this.hauteurLevageAdmCalc2 = Number(data.Mec_levage_1_levage_hauteur_de_levage_admiss_calcul_2);
    if (data.Hauteur_de_levage_admissible_pour_le_levage_calculee !== undefined) this.hauteurLevageAdmCalculee = Number(data.Hauteur_de_levage_admissible_pour_le_levage_calculee);
    if (data.Calculer_valeur_consigne_vitesse_rotation_du_mec_levage_suivant_la_charge !== undefined) this.consigneVitesseRotationCharge = Number(data.Calculer_valeur_consigne_vitesse_rotation_du_mec_levage_suivant_la_charge);
    if (data.Mecanisme_de_levage_vitesse_admissible_en_t_min !== undefined) this.vitesseLevageAdmTMin = Number(data.Mecanisme_de_levage_vitesse_admissible_en_t_min);
    if (data.Rapport_de_transmission_reducteur_pour_mec_de_levage_vitesse_rapide !== undefined) this.rapportTransmissionRapide = Number(data.Rapport_de_transmission_reducteur_pour_mec_de_levage_vitesse_rapide);
    if (data.Betriebsdruck_HW1_Bremse !== undefined) this.betriebsdruckHW1 = Number(data.Betriebsdruck_HW1_Bremse);
    if (data.Betriebsdruck_HW2_Bremse !== undefined) this.betriebsdruckHW2 = Number(data.Betriebsdruck_HW2_Bremse);
    if (data.Lastmessbolzen_Hubwerk_1_DMS_2 !== undefined) this.lastmessbolzenHW1DMS2 = Number(data.Lastmessbolzen_Hubwerk_1_DMS_2);
    if (data.Lastmessbolzen_Hubwerk_1_DMS_1 !== undefined) this.lastmessbolzenHW1DMS1 = Number(data.Lastmessbolzen_Hubwerk_1_DMS_1);
    // Hoist calibration
    if (data.CU1_PZD4_Hoist1_DMS1_P1_Abgleich !== undefined) this.cu1Pzd4Hoist1Dms1P1 = Number(data.CU1_PZD4_Hoist1_DMS1_P1_Abgleich);
    if (data.CU1_PZD5_Hoist1_DMS2_P1_Abgleich !== undefined) this.cu1Pzd5Hoist1Dms2P1 = Number(data.CU1_PZD5_Hoist1_DMS2_P1_Abgleich);
    if (data.CU1_PZD6_Hoist1_DMS1_P2_Abgleich !== undefined) this.cu1Pzd6Hoist1Dms1P2 = Number(data.CU1_PZD6_Hoist1_DMS1_P2_Abgleich);
    if (data.CU1_PZD7_Hoist1_DMS2_P2_Abgleich !== undefined) this.cu1Pzd7Hoist1Dms2P2 = Number(data.CU1_PZD7_Hoist1_DMS2_P2_Abgleich);
    if (data.CU1_PZD8_Hoist2_DMS1_P1_Abgleich !== undefined) this.cu1Pzd8Hoist2Dms1P1 = Number(data.CU1_PZD8_Hoist2_DMS1_P1_Abgleich);
    if (data.CU1_PZD9_Hoist2_DMS2_P1_Abgleich !== undefined) this.cu1Pzd9Hoist2Dms2P1 = Number(data.CU1_PZD9_Hoist2_DMS2_P1_Abgleich);
    if (data.CU1_PZD10_Hoist2_DMS1_P2_Abgleich !== undefined) this.cu1Pzd10Hoist2Dms1P2 = Number(data.CU1_PZD10_Hoist2_DMS1_P2_Abgleich);
    if (data.CU1_PZD11_Hoist2_DMS2_P2_Abgleich !== undefined) this.cu1Pzd11Hoist2Dms2P2 = Number(data.CU1_PZD11_Hoist2_DMS2_P2_Abgleich);
    // Hoist torque
    if (data.Levage_couple_d_acceleration_vitesse_rapide !== undefined) this.levageCoupleAccelRapide = Number(data.Levage_couple_d_acceleration_vitesse_rapide);
    if (data.Levage_couple_de_freinage_vitesse_rapide !== undefined) this.levageCoupleFreinRapide = Number(data.Levage_couple_de_freinage_vitesse_rapide);
    if (data.Levage_couple_d_acceleration_vitesse_moyenne !== undefined) this.levageCoupleAccelMoyen = Number(data.Levage_couple_d_acceleration_vitesse_moyenne);
    if (data.Levage_couple_de_freinage_vitesse_moyenne !== undefined) this.levageCoupleFreinMoyen = Number(data.Levage_couple_de_freinage_vitesse_moyenne);
    if (data.Levage_couple_d_acceleration_vitesse_lente !== undefined) this.levageCoupleAccelLent = Number(data.Levage_couple_d_acceleration_vitesse_lente);
    if (data.Levage_couple_de_freinage_vitesse_lente !== undefined) this.levageCoupleFreinLent = Number(data.Levage_couple_de_freinage_vitesse_lente);
    // Hoist DMS test values
    if (data.API_mec_levage_1_jauge_DMS_1_valeur_de_capteur_charge_dessai_1 !== undefined) this.apiLevage1Dms1Charge1 = Number(data.API_mec_levage_1_jauge_DMS_1_valeur_de_capteur_charge_dessai_1);
    if (data.API_mec_levage_1_jauge_DMS_2_valeur_de_capteur_charge_dessai_1 !== undefined) this.apiLevage1Dms2Charge1 = Number(data.API_mec_levage_1_jauge_DMS_2_valeur_de_capteur_charge_dessai_1);
    if (data.API_mec_levage_1_jauge_DMS_1_valeur_de_capteur_charge_dessai_2 !== undefined) this.apiLevage1Dms1Charge2 = Number(data.API_mec_levage_1_jauge_DMS_1_valeur_de_capteur_charge_dessai_2);
    if (data.API_mec_levage_1_jauge_DMS_2_valeur_de_capteur_charge_dessai_2 !== undefined) this.apiLevage1Dms2Charge2 = Number(data.API_mec_levage_1_jauge_DMS_2_valeur_de_capteur_charge_dessai_2);
    if (data.API_mec_levage_2_jauge_DMS_1_valeur_de_capteur_charge_dessai_1 !== undefined) this.apiLevage2Dms1Charge1 = Number(data.API_mec_levage_2_jauge_DMS_1_valeur_de_capteur_charge_dessai_1);
    if (data.API_mec_levage_2_jauge_DMS_2_valeur_de_capteur_charge_dessai_1 !== undefined) this.apiLevage2Dms2Charge1 = Number(data.API_mec_levage_2_jauge_DMS_2_valeur_de_capteur_charge_dessai_1);
    if (data.API_mec_levage_2_jauge_DMS_1_valeur_de_capteur_charge_dessai_2 !== undefined) this.apiLevage2Dms1Charge2 = Number(data.API_mec_levage_2_jauge_DMS_1_valeur_de_capteur_charge_dessai_2);
    if (data.API_mec_levage_2_jauge_DMS_2_valeur_de_capteur_charge_dessai_2 !== undefined) this.apiLevage2Dms2Charge2 = Number(data.API_mec_levage_2_jauge_DMS_2_valeur_de_capteur_charge_dessai_2);

    // SLEW TELEMETRY (Extended)
    if (data.Valeur_de_consigne_manipulateur_pour_orientation !== undefined) this.consigneManipOrientation = Number(data.Valeur_de_consigne_manipulateur_pour_orientation);
    if (data.Calculer_val_consigne_vitesse_du_mec_orientation_suivant_la_portee !== undefined) this.consigneVitesseOrientPortee = Number(data.Calculer_val_consigne_vitesse_du_mec_orientation_suivant_la_portee);
    if (data.Betriebsdruck_Drehwerksbremse_1 !== undefined) this.betriebsdruckDrehwerk1 = Number(data.Betriebsdruck_Drehwerksbremse_1);
    if (data.Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_droite !== undefined) this.consigneFixeOrientDroite = Number(data.Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_droite);
    if (data.Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_gauche !== undefined) this.consigneFixeOrientGauche = Number(data.Valeur_cons_fixe_pour_actionnement_par_a_coups_superstr_orientation_a_gauche);

    // LUFFING TELEMETRY (Extended)
    if (data.Vitesse_reelle_du_cylindre_de_variation_de_volee !== undefined) this.vitesseReelleCylindre = Number(data.Vitesse_reelle_du_cylindre_de_variation_de_volee);
    if (data.Valeur_de_consigne_manipulateur_pour_volee !== undefined) this.consigneManipVolee = Number(data.Valeur_de_consigne_manipulateur_pour_volee);
    if (data.Portee_regime_admissible_en_fonction_de_la_charge !== undefined) this.porteeAdmissibleCharge = Number(data.Portee_regime_admissible_en_fonction_de_la_charge);
    if (data.Relevage_fleche_calculer_la_portee_admissible !== undefined) this.relevageCalculerPorteeAdm = Number(data.Relevage_fleche_calculer_la_portee_admissible);
    if (data.Abaissement_fleche_calculer_la_portee_admissible !== undefined) this.abaissementCalculerPorteeAdm = Number(data.Abaissement_fleche_calculer_la_portee_admissible);
    if (data.Portee_admissible_relevage_fleche_sans_limitation_calcul_1 !== undefined) this.porteeAdmRelevageCalc1 = Number(data.Portee_admissible_relevage_fleche_sans_limitation_calcul_1);
    if (data.Portee_admissible_relevage_fleche_sans_limitation_calcul_2 !== undefined) this.porteeAdmRelevageCalc2 = Number(data.Portee_admissible_relevage_fleche_sans_limitation_calcul_2);
    if (data.Reduction_valeur_de_consigne_de_la_soupape_detranglement_du_mec_de_volee !== undefined) this.reductionConsigneEtranglementVolee = Number(data.Reduction_valeur_de_consigne_de_la_soupape_detranglement_du_mec_de_volee);
    if (data.Valeur_pression_pr_niv_de_press_2_en_bars_lors_relev_fleche_en_portee_min !== undefined) this.pressionNiv2RelevagePorteeMin = Number(data.Valeur_pression_pr_niv_de_press_2_en_bars_lors_relev_fleche_en_portee_min);
    if (data.Valeur_pression_pr_niv_de_press_2_en_bars_lors_relev_fleche_en_portee_maxi !== undefined) this.pressionNiv2RelevagePorteeMax = Number(data.Valeur_pression_pr_niv_de_press_2_en_bars_lors_relev_fleche_en_portee_maxi);
    if (data.Valeur_pression_pr_niv_de_press_3_en_bars_lors_abaiss_fleche_en_portee_mini !== undefined) this.pressionNiv3AbaissPorteeMin = Number(data.Valeur_pression_pr_niv_de_press_3_en_bars_lors_abaiss_fleche_en_portee_mini);
    if (data.Valeur_pression_pr_niv_de_press_3_en_bars_lors_abaiss_fleche_en_portee_maxi !== undefined) this.pressionNiv3AbaissPorteeMax = Number(data.Valeur_pression_pr_niv_de_press_3_en_bars_lors_abaiss_fleche_en_portee_maxi);
    if (data.Val_press_pr_niv_press_6_en_bars_lors_abaiss_fleche_portee_mini_charge_lourde !== undefined) this.pressionNiv6AbaissPorteeMinLourde = Number(data.Val_press_pr_niv_press_6_en_bars_lors_abaiss_fleche_portee_mini_charge_lourde);
    if (data.Val_press_pr_niv_press_6_en_bars_lors_abaiss_fleche_portee_maxi_charge_lourde !== undefined) this.pressionNiv6AbaissPorteeMaxLourde = Number(data.Val_press_pr_niv_press_6_en_bars_lors_abaiss_fleche_portee_maxi_charge_lourde);
    if (data.Druckwert_fur_Druckstufe_7_in_bar_fur_Ausleger_Anheben_Wartungsbetrieb !== undefined) this.druckwertStufe7Wartung = Number(data.Druckwert_fur_Druckstufe_7_in_bar_fur_Ausleger_Anheben_Wartungsbetrieb);
    // Luffing torque
    if (data.Abaisser_la_fleche_couple_d_acceleration_vitesse_rapide !== undefined) this.abaissCouplAccelRapide = Number(data.Abaisser_la_fleche_couple_d_acceleration_vitesse_rapide);
    if (data.Abaisser_la_fleche_couple_de_freinage_vitesse_rapide !== undefined) this.abaissCouplFreinRapide = Number(data.Abaisser_la_fleche_couple_de_freinage_vitesse_rapide);
    if (data.Relevage_de_la_fleche_couple_d_acceleration_vitesse_rapide !== undefined) this.relevageCouplAccelRapide = Number(data.Relevage_de_la_fleche_couple_d_acceleration_vitesse_rapide);
    if (data.Relevage_de_la_fleche_couple_de_freinage_vitesse_rapide !== undefined) this.relevageCouplFreinRapide = Number(data.Relevage_de_la_fleche_couple_de_freinage_vitesse_rapide);
    if (data.Abaisser_la_fleche_couple_d_acceleration_vitesse_moyenne !== undefined) this.abaissCouplAccelMoyen = Number(data.Abaisser_la_fleche_couple_d_acceleration_vitesse_moyenne);
    if (data.Abaisser_la_fleche_couple_de_freinage_vitesse_moyenne !== undefined) this.abaissCouplFreinMoyen = Number(data.Abaisser_la_fleche_couple_de_freinage_vitesse_moyenne);
    if (data.Relevage_de_la_fleche_couple_d_acceleration_vitesse_moyenne !== undefined) this.relevageCouplAccelMoyen = Number(data.Relevage_de_la_fleche_couple_d_acceleration_vitesse_moyenne);
    if (data.Relevage_de_la_fleche_couple_de_freinage_vitesse_moyenne !== undefined) this.relevageCouplFreinMoyen = Number(data.Relevage_de_la_fleche_couple_de_freinage_vitesse_moyenne);
    if (data.Abaisser_la_fleche_couple_d_acceleration_vitesse_lente !== undefined) this.abaissCouplAccelLent = Number(data.Abaisser_la_fleche_couple_d_acceleration_vitesse_lente);
    if (data.Abaisser_la_fleche_couple_de_freinage_vitesse_lente !== undefined) this.abaissCouplFreinLent = Number(data.Abaisser_la_fleche_couple_de_freinage_vitesse_lente);
    if (data.Relevage_de_la_fleche_couple_d_acceleration_vitesse_lente !== undefined) this.relevageCouplAccelLent = Number(data.Relevage_de_la_fleche_couple_d_acceleration_vitesse_lente);
    if (data.Relevage_de_la_fleche_couple_de_freinage_vitesse_lente !== undefined) this.relevageCouplFreinLent = Number(data.Relevage_de_la_fleche_couple_de_freinage_vitesse_lente);
    // Luffing valve setpoints (Tandemlift)
    if (data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINP !== undefined) this.sollwerteDrosselTandemliftYminP = Number(data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINP);
    if (data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXP !== undefined) this.sollwerteDrosselTandemliftYmaxP = Number(data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXP);
    if (data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINN !== undefined) this.sollwerteDrosselTandemliftYminN = Number(data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMINN);
    if (data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXN !== undefined) this.sollwerteDrosselTandemliftYmaxN = Number(data.Sollwerte_Drosselventil_Wippzylinder_Tandemlift_YMAXN);
    // Luffing slow speed
    if (data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMINP !== undefined) this.consignePompeVoleeLenteYminP = Number(data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMINP);
    if (data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMAXP !== undefined) this.consignePompeVoleeLenteYmaxP = Number(data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMAXP);
    if (data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMINN !== undefined) this.consignePompeVoleeLenteYminN = Number(data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMINN);
    if (data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMAXN !== undefined) this.consignePompeVoleeLenteYmaxN = Number(data.Valeurs_cons_pompe_hydr_variation_de_volee_lente_YMAXN);
    if (data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMINP !== undefined) this.sollwerteDrosselLangsamYminP = Number(data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMINP);
    if (data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMAXP !== undefined) this.sollwerteDrosselLangsamYmaxP = Number(data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMAXP);
    if (data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMINN !== undefined) this.sollwerteDrosselLangsamYminN = Number(data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMINN);
    if (data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMAXN !== undefined) this.sollwerteDrosselLangsamYmaxN = Number(data.Sollwerte_Drosselventil_Wippzylinder_langsame_Wippstufe_YMAXN);
    // Luffing personnel transport
    if (data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMINP !== undefined) this.sollwerteDrosselPersonenYminP = Number(data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMINP);
    if (data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMAXP !== undefined) this.sollwerteDrosselPersonenYmaxP = Number(data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMAXP);
    if (data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMINN !== undefined) this.sollwerteDrosselPersonenYminN = Number(data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMINN);
    if (data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMAXN !== undefined) this.sollwerteDrosselPersonenYmaxN = Number(data.Sollwerte_Drosselventil_Wippzylinder_Personentransport_YMAXN);
    // Luffing medium speed
    if (data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMINP !== undefined) this.sollwertePumpeMittelYminP = Number(data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMINP);
    if (data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMAXP !== undefined) this.sollwertePumpeMittelYmaxP = Number(data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMAXP);
    if (data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMINN !== undefined) this.sollwertePumpeMittelYminN = Number(data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMINN);
    if (data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMAXN !== undefined) this.sollwertePumpeMittelYmaxN = Number(data.Sollwerte_Haupthydraulikpumpe_mittlere_Wippstufe_YMAXN);
    if (data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMINP !== undefined) this.sollwerteDrosselMittelYminP = Number(data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMINP);
    if (data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMAXP !== undefined) this.sollwerteDrosselMittelYmaxP = Number(data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMAXP);
    if (data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMINN !== undefined) this.sollwerteDrosselMittelYminN = Number(data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMINN);
    if (data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMAXN !== undefined) this.sollwerteDrosselMittelYmaxN = Number(data.Sollwerte_Drosselventil_mittlere_Wippstufe_YMAXN);
    // Luffing fast speed
    if (data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMINP !== undefined) this.consignePompeVoleeRapideYminP = Number(data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMINP);
    if (data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMAXP !== undefined) this.consignePompeVoleeRapideYmaxP = Number(data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMAXP);
    if (data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMINN !== undefined) this.consignePompeVoleeRapideYminN = Number(data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMINN);
    if (data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMAXN !== undefined) this.consignePompeVoleeRapideYmaxN = Number(data.Valeurs_de_consigne_pompe_hydraulique_ppale_var_de_volee_rapide_YMAXN);
    if (data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMINP !== undefined) this.consigneEtranglementRapideYminP = Number(data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMINP);
    if (data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMAXP !== undefined) this.consigneEtranglementRapideYmaxP = Number(data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMAXP);
    if (data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMINN !== undefined) this.consigneEtranglementRapideYminN = Number(data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMINN);
    if (data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMAXN !== undefined) this.consigneEtranglementRapideYmaxN = Number(data.Valeurs_cons_soupape_d_etranglement_variation_de_volee_rapide_YMAXN);
    // Luffing mA values
    if (data.Reduction_vitesse_var_de_volee_lors_du_relevage_de_fleche_et_trois_mouvements !== undefined) this.reductionVitesse3Mouvements = Number(data.Reduction_vitesse_var_de_volee_lors_du_relevage_de_fleche_et_trois_mouvements);
    if (data.mA_pour_niveau_de_pression_2_xxx_bars_relevage_de_fleche_en_portee_maxi !== undefined) this.mANiveau2RelevagePorteeMax = Number(data.mA_pour_niveau_de_pression_2_xxx_bars_relevage_de_fleche_en_portee_maxi);
    if (data.mA_pour_niveau_de_pression_2_xxx_bars_relevage_de_fleche_en_portee_min !== undefined) this.mANiveau2RelevagePorteeMin = Number(data.mA_pour_niveau_de_pression_2_xxx_bars_relevage_de_fleche_en_portee_min);
    if (data.mA_pour_niveau_de_pression_3_xxx_bars_abaissement_de_fleche_en_portee_mini !== undefined) this.mANiveau3AbaissPorteeMin = Number(data.mA_pour_niveau_de_pression_3_xxx_bars_abaissement_de_fleche_en_portee_mini);
    if (data.mA_pour_niveau_de_pression_3_xxx_bars_abaissement_de_fleche_en_portee_maxi !== undefined) this.mANiveau3AbaissPorteeMax = Number(data.mA_pour_niveau_de_pression_3_xxx_bars_abaissement_de_fleche_en_portee_maxi);
    if (data.mA_pour_pression_4_280_bars_calage_relever_fleche !== undefined) this.mANiveau4CalageRelever = Number(data.mA_pour_pression_4_280_bars_calage_relever_fleche);
    if (data.mA_pr_niveau_press_6_xxx_bars_abaissement_fleche_en_portee_mini_charge_lourde !== undefined) this.mANiveau6AbaissPorteeMinLourde = Number(data.mA_pr_niveau_press_6_xxx_bars_abaissement_fleche_en_portee_mini_charge_lourde);
    if (data.mA_pr_niveau_press_6_xxx_bars_abaissement_fleche_en_portee_maxi_charge_lourde !== undefined) this.mANiveau6AbaissPorteeMaxLourde = Number(data.mA_pr_niveau_press_6_xxx_bars_abaissement_fleche_en_portee_maxi_charge_lourde);
    if (data.mA_pr_niveau_press_7_xxx_bars_relevage_fleche_mode_entretien !== undefined) this.mANiveau7RelevageMaintenance = Number(data.mA_pr_niveau_press_7_xxx_bars_relevage_fleche_mode_entretien);

    // TRANSLATION TELEMETRY (Extended)
    if (data.Valeur_de_consigne_translation !== undefined) this.consigneTranslation = Number(data.Valeur_de_consigne_translation);
    if (data.Translation_valeur_de_consigne !== undefined) this.translationValeurConsigne = Number(data.Translation_valeur_de_consigne);
    if (data.Sollwert_Druckabschneidung_Lenkpumpe_1 !== undefined) this.sollwertDruckLenkpumpe1 = Number(data.Sollwert_Druckabschneidung_Lenkpumpe_1);
    if (data.Sollwert_Druckabschneidung_Lenkpumpe_2 !== undefined) this.sollwertDruckLenkpumpe2 = Number(data.Sollwert_Druckabschneidung_Lenkpumpe_2);
    // Translation fast speed
    if (data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINP !== undefined) this.consignePompeTranslRapideYminP = Number(data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINP);
    if (data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXP !== undefined) this.consignePompeTranslRapideYmaxP = Number(data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXP);
    if (data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINN !== undefined) this.consignePompeTranslRapideYminN = Number(data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMINN);
    if (data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXN !== undefined) this.consignePompeTranslRapideYmaxN = Number(data.Valeurs_de_cons_pompe_hydraul_ppale_pour_mec_translation_rapide_YMAXN);
    if (data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINP !== undefined) this.consigneSoupapeTranslRapideYminP = Number(data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINP);
    if (data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXP !== undefined) this.consigneSoupapeTranslRapideYmaxP = Number(data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXP);
    if (data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINN !== undefined) this.consigneSoupapeTranslRapideYminN = Number(data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMINN);
    if (data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXN !== undefined) this.consigneSoupapeTranslRapideYmaxN = Number(data.Valeurs_de_consigne_pour_la_soupape_de_translation_rapide_YMAXN);
    // Translation medium speed
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMINP !== undefined) this.sollwertePumpeTranslMittelYminP = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMINP);
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMAXP !== undefined) this.sollwertePumpeTranslMittelYmaxP = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMAXP);
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMINN !== undefined) this.sollwertePumpeTranslMittelYminN = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMINN);
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMAXN !== undefined) this.sollwertePumpeTranslMittelYmaxN = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahrwerk_mittel_YMAXN);
    if (data.Sollwerte_fur_Fahren_Ventil_mittel_YMINP !== undefined) this.sollwerteVentilTranslMittelYminP = Number(data.Sollwerte_fur_Fahren_Ventil_mittel_YMINP);
    if (data.Sollwerte_fur_Fahren_Ventil_mittel_YMAXP !== undefined) this.sollwerteVentilTranslMittelYmaxP = Number(data.Sollwerte_fur_Fahren_Ventil_mittel_YMAXP);
    if (data.Sollwerte_fur_Fahren_Ventil_mittel_YMINN !== undefined) this.sollwerteVentilTranslMittelYminN = Number(data.Sollwerte_fur_Fahren_Ventil_mittel_YMINN);
    if (data.Sollwerte_fur_Fahren_Ventil_mittel_YMAXN !== undefined) this.sollwerteVentilTranslMittelYmaxN = Number(data.Sollwerte_fur_Fahren_Ventil_mittel_YMAXN);
    // Translation slow speed
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMINP !== undefined) this.sollwertePumpeTranslLangsamYminP = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMINP);
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMAXP !== undefined) this.sollwertePumpeTranslLangsamYmaxP = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMAXP);
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMINN !== undefined) this.sollwertePumpeTranslLangsamYminN = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMINN);
    if (data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMAXN !== undefined) this.sollwertePumpeTranslLangsamYmaxN = Number(data.Sollwerte_Haupthydraulikpumpe_fur_Fahren_langsam_YMAXN);
    if (data.Sollwerte_fur_Fahren_langsam_YMINP !== undefined) this.sollwerteTranslLangsamYminP = Number(data.Sollwerte_fur_Fahren_langsam_YMINP);
    if (data.Sollwerte_fur_Fahren_langsam_YMAXP !== undefined) this.sollwerteTranslLangsamYmaxP = Number(data.Sollwerte_fur_Fahren_langsam_YMAXP);
    if (data.Sollwerte_fur_Fahren_langsam_YMINN !== undefined) this.sollwerteTranslLangsamYminN = Number(data.Sollwerte_fur_Fahren_langsam_YMINN);
    if (data.Sollwerte_fur_Fahren_langsam_YMAXN !== undefined) this.sollwerteTranslLangsamYmaxN = Number(data.Sollwerte_fur_Fahren_langsam_YMAXN);

    this.updateCharts();
    this.cdr.detectChanges();
  }

  addToHistory(arr: number[], val: number): void {
    arr.push(val);
    if (arr.length > this.maxDataPoints) arr.shift();
  }

  initCharts(): void {
    this.puissanceChartOptions = this.createSparkline('#FEB019');
    this.courantChartOptions = this.createSparkline('#008FFB');
    this.dms1ChartOptions = this.createSparkline('#00E396');
    this.dms2ChartOptions = this.createSparkline('#FF4560');
  }

  createSparkline(color: string): SparklineOptions {
    return {
      series: [{ name: 'Value', data: [] }],
      chart: { type: 'area', height: 60, sparkline: { enabled: true } },
      stroke: { curve: 'smooth', width: 2 },
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
      colors: [color],
      xaxis: { type: 'category' },
      yaxis: { show: false },
      dataLabels: { enabled: false },
      tooltip: { theme: 'dark' }
    };
  }

  updateCharts(): void {
    if (this.puissanceChartOptions) this.puissanceChartOptions.series = [{ name: 'Power', data: [...this.puissanceHistory] }];
    if (this.courantChartOptions) this.courantChartOptions.series = [{ name: 'Current', data: [...this.courantReelHistory] }];
    if (this.dms1ChartOptions) this.dms1ChartOptions.series = [{ name: 'DMS1', data: [...this.dms1History] }];
    if (this.dms2ChartOptions) this.dms2ChartOptions.series = [{ name: 'DMS2', data: [...this.dms2History] }];
  }

  // Helper methods
  getWindClass(): string {
    if (this.vitesseVent >= 15) return 'danger';
    if (this.vitesseVent >= 8) return 'warning';
    return 'safe';
  }

  getTempColor(temp: number, max: number): string {
    const ratio = temp / max;
    if (ratio >= 0.85) return '#FF4560';
    if (ratio >= 0.65) return '#FEB019';
    return '#00E396';
  }

  getFuelClass(): string {
    if (this.niveauCarburant <= 15) return 'critical';
    if (this.niveauCarburant <= 30) return 'low';
    return 'normal';
  }

  getFreqClass(): string {
    if (this.frequenceReseau < 58 || this.frequenceReseau > 62) return 'danger';
    if (this.frequenceReseau < 59 || this.frequenceReseau > 61) return 'warning';
    return 'safe';
  }
}
