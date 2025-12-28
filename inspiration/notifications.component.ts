import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MqttService, IMqttMessage } from 'ngx-mqtt';
import { HistoryPanelComponent } from '../components/history-panel/history-panel.component';
import { HistoryService, TimeRange, HistoryDataPoint } from '../services/history.service';

// Notification tag definition
interface NotificationTag {
  tagName: string;
  message: string;
  type: 'Critical' | 'Alarm' | 'Warning' | 'Fault' | 'Info';
  category: string;
}

// Active notification
export interface Notification {
  id: number;
  tagName: string;
  timestamp: Date;
  message: string;
  type: 'Critical' | 'Alarm' | 'Warning' | 'Fault' | 'Info';
  category: string;
  isRead: boolean;
  isActive: boolean;
}

// All notification tags from the specification
const NOTIFICATION_TAGS: NotificationTag[] = [
  // Diesel Engine
  { tagName: 'Dieselmotor_Not_Aus', message: 'ARRÊT D\'URGENCE MOTEUR ACTIVÉ', type: 'Critical', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_Oeldruck_zu_niedrig_GHxK2', message: 'Pression d\'huile moteur critique (Basse)', type: 'Alarm', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_Kuehlwassertemperatur_zu_hoch_GI', message: 'Surchauffe moteur : Temp. eau trop élevée', type: 'Alarm', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_Kuehlwassermangel_GHxK2', message: 'Niveau liquide de refroidissement bas', type: 'Warning', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_Ueberdrehzahl_GHxK2', message: 'Alarme : Survitesse moteur détectée', type: 'Alarm', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_Wasser_im_Vorfilter_GHxK2', message: 'Eau détectée dans le préfiltre carburant', type: 'Warning', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_Ladeluftpumpe_Stoerung_GHxK2', message: 'Défaut : Pompe d\'air de suralimentation', type: 'Fault', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_EDC_Fehler_GHxK2', message: 'Erreur système injection (EDC)', type: 'Fault', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_MFR_Fehler_GHxK2', message: 'Erreur contrôleur moteur (MFR)', type: 'Fault', category: 'Diesel Engine' },
  { tagName: 'Dieselmotor_Abstellalarm_GHxK2', message: 'Alarme d\'arrêt moteur général', type: 'Alarm', category: 'Diesel Engine' },

  // Emergency
  { tagName: 'Fahrwerk_Not_Halt_ausgelost', message: 'ARRÊT D\'URGENCE TRANSLATION GÉNÉRAL', type: 'Critical', category: 'Emergency' },
  { tagName: 'Fahrwerk_Not_Halt_vorne_rechts', message: 'AU Translation : Avant Droite', type: 'Critical', category: 'Emergency' },
  { tagName: 'Fahrwerk_Not_Halt_vorne_links', message: 'AU Translation : Avant Gauche', type: 'Critical', category: 'Emergency' },
  { tagName: 'Fahrwerk_Not_Halt_hinten_rechts', message: 'AU Translation : Arrière Droite', type: 'Critical', category: 'Emergency' },
  { tagName: 'Fahrwerk_Not_Halt_hinten_links', message: 'AU Translation : Arrière Gauche', type: 'Critical', category: 'Emergency' },
  { tagName: 'Fahrwerk_Not_Halt_Mitte_rechts', message: 'AU Translation : Milieu Droite', type: 'Critical', category: 'Emergency' },
  { tagName: 'Fahrwerk_Not_Halt_Mitte_links', message: 'AU Translation : Milieu Gauche', type: 'Critical', category: 'Emergency' },
  { tagName: 'OPT_Fahrwerk_Notendschalter_vorne', message: 'Fin de course urgence : Translation Avant', type: 'Warning', category: 'Emergency' },
  { tagName: 'OPT_Fahrwerk_Notendschalter_hinten', message: 'Fin de course urgence : Translation Arrière', type: 'Alarm', category: 'Emergency' },

  // Safety System
  { tagName: 'HW1_B_w_Sicherheits_SPS_Limit_Verschleigrenz', message: 'Critique : Limite d\'usure frein levage 1 atteinte', type: 'Critical', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Warnung_Verschleigr', message: 'Avertissement : Usure frein levage 1', type: 'Warning', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Sersorstwert_bei_Br', message: 'Défaut Capteur : Frein levage 1 reste ouvert', type: 'Fault', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Diskrepanzfehler_Ser', message: 'Erreur incohérence capteurs (Levage 1)', type: 'Fault', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Ruckmeldung_IBS', message: 'Retour info SPS sécurité IBS Levage 1', type: 'Info', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Warnung_Verschleigrenze', message: 'Avertissement : Limite usure frein levage 1', type: 'Warning', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Sersoristwert_bei_Bremse_offen_fehlerhaft', message: 'Défaut capteur frein levage 1 ouvert', type: 'Fault', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Diskrepanzfehler_Sensoristwerte', message: 'Erreur discordance capteurs levage 1', type: 'Fault', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Limit_Verschleigrenze', message: 'Limite usure frein levage 1 atteinte', type: 'Critical', category: 'Safety System' },
  { tagName: 'HW1_B_w_Sicherheits_SPS_Absicherung', message: 'Protection SPS sécurité levage 1', type: 'Fault', category: 'Safety System' },
  { tagName: 'Hubwerk1_Bremsschutz', message: 'Protection frein levage 1 déclenchée', type: 'Warning', category: 'Safety System' },
  { tagName: 'Drehwerk_Bremsschutz', message: 'Protection frein orientation déclenchée', type: 'Alarm', category: 'Safety System' },
  { tagName: 'OPT_Fahrwerk_Hinderniserkennung_vorne_rechts', message: 'Obstacle détecté : Avant Droite', type: 'Warning', category: 'Safety System' },
  { tagName: 'OPT_Fahrwerk_Hinderniserkennung_vorne_links', message: 'Obstacle détecté : Avant Gauche', type: 'Warning', category: 'Safety System' },
  { tagName: 'OPT_Fahrwerk_Hinderniserkennung_hinten_rechts', message: 'Obstacle détecté : Arrière Droite', type: 'Warning', category: 'Safety System' },
  { tagName: 'OPT_Fahrwerk_Hinderniserkennung_hinten_links', message: 'Obstacle détecté : Arrière Gauche', type: 'Warning', category: 'Safety System' },

  // Electrical
  { tagName: 'VAR_Fremdeinspeisung_Temperaturuberwachung', message: 'Arrêt : Surchauffe transformateur externe', type: 'Critical', category: 'Electrical' },
  { tagName: 'Absicherung_Spreader', message: 'Défaut fusible : Spreader', type: 'Fault', category: 'Electrical' },
  { tagName: 'FI_Schutzschalter_Spreader', message: 'Disjoncteur différentiel Spreader déclenché', type: 'Fault', category: 'Electrical' },
  { tagName: 'Absicherung_Monitor_Turmkabine', message: 'Défaut alim. : Moniteur cabine', type: 'Fault', category: 'Electrical' },
  { tagName: 'Absicherung_Leistungsmessumformer', message: 'Défaut protection : Convertisseur de puissance', type: 'Fault', category: 'Electrical' },
  { tagName: 'Hauptsicherung_Arbeitsplatzbeleuchtung_Portal', message: 'Fusible éclairage portique grillé', type: 'Warning', category: 'Electrical' },

  // Status (Info)
  { tagName: 'Kranhauptschalter_ist_EIN', message: 'Grue sous tension (ON)', type: 'Info', category: 'Status (Info)' },
  { tagName: 'Uberwachung_Signal_Dieselmotor_in_Betrieb', message: 'Moteur Diesel en marche', type: 'Info', category: 'Status (Info)' },
  { tagName: 'Sturmbolzen_rechts_verriegelt', message: 'Verrouillage tempête engagé (Droite)', type: 'Info', category: 'Status (Info)' },
  { tagName: 'Sturmbolzen_links_verriegelt', message: 'Verrouillage tempête engagé (Gauche)', type: 'Info', category: 'Status (Info)' },
  { tagName: 'Ruckmeldung_Container_verriegelt', message: 'Container Verrouillé', type: 'Info', category: 'Status (Info)' },

  // System & Communication Faults
  { tagName: 'Abschaltung_Programm_durch_DP_Bus_Fehler', message: 'Arrêt Programme : Erreur Bus Profibus (DP)', type: 'Critical', category: 'System' },
  { tagName: 'Abschaltung_Programm_durch_ASI_Bus_Fehler', message: 'Arrêt Programme : Erreur Bus ASI', type: 'Critical', category: 'System' },

  // Spreader & Twistlocks
  { tagName: 'Ruckmeldung_Container_entriegelt', message: 'Container Déverrouillé', type: 'Info', category: 'Spreader' },
  { tagName: 'Ruckmeldung_Spreader_aufgesetzt', message: 'Spreader posé sur container (Landed)', type: 'Info', category: 'Spreader' },
  { tagName: 'Ruckmeldung_Spreader_in_Mittelstellung', message: 'Spreader centré (Mittelstellung)', type: 'Info', category: 'Spreader' },
  { tagName: 'Ruckmeldung_1_Spreader_gesteckt', message: 'Câble Spreader Connecté', type: 'Info', category: 'Spreader' },
  { tagName: 'RCLD_Ruckmeldung_Twistlocks_verriegelt', message: 'Twistlocks Verrouillés (Feedback RCLD)', type: 'Info', category: 'Spreader' },

  // Hoist Mechanism 1 & 2 (Levage)
  { tagName: 'Mecanisme_de_levage_1_2_mecanisme_d_orientation', message: 'Mécanisme de levage 1/2 et orientation', type: 'Info', category: 'Hoist' },
  { tagName: 'Entrainement_mec_levage_1', message: 'Entraînement mécanique levage 1', type: 'Info', category: 'Hoist' },
  { tagName: 'Entrainement_mec_levage_2', message: 'Entraînement mécanique levage 2', type: 'Info', category: 'Hoist' },
  { tagName: 'TK_Steuerhebel_Motorgreifer_Hubwerk2_Schlieen', message: 'Levier commande : Grappin motorisé Levage 2 Fermer', type: 'Info', category: 'Hoist' },
  { tagName: 'TK_Steuerhebel_Motorgreifer_Hubwerk2_Offnen', message: 'Levier commande : Grappin motorisé Levage 2 Ouvrir', type: 'Info', category: 'Hoist' },
  { tagName: 'TK_Steuerhebel_Hubwerk_Fahrwerk_Heben_Ruckwarts_fahren', message: 'Levier : Levage monter / Recul translation', type: 'Info', category: 'Hoist' },
  { tagName: 'TK_Steuerhebel_Hubwerk_Fahrwerk_Senken_Vorwarts_fahren', message: 'Levier : Levage descendre / Avance translation', type: 'Info', category: 'Hoist' },
  { tagName: 'TK_Totmanntaste_Hubwerk_Hubwerk2_Motorgreifer', message: 'Bouton homme mort : Levage 1/2 Grappin', type: 'Info', category: 'Hoist' },
  { tagName: 'TK_Totmannsensor_Spohn_Hubwerk_Hubwerk2_Motorgreifer', message: 'Capteur homme mort Spohn : Levage 1/2 Grappin', type: 'Info', category: 'Hoist' },
  { tagName: 'FS_TK_Steuerhebel_Hubwerk_Fahrwerk_Nullstellung', message: 'Levier Levage/Translation en position neutre', type: 'Info', category: 'Hoist' },
  { tagName: 'FS_TK_Steuerhebel_Motorgreifer_Hubwerk2_Nullstellung', message: 'Levier Grappin/Levage 2 en position neutre', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk_Taste_Abgleich_Hubhohe', message: 'Touche calibrage hauteur de levage', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Getriebeumschaltung_Endstellung_Getriebestufe_I_langsam', message: 'Levage 1 : Position finale vitesse I (lente)', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Getriebeumschaltung_Mittelstellung_I_II', message: 'Levage 1 : Position intermédiaire I/II', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerksgetriebeumschaltung_Endstellung_Getriebestufe_II_Mittel_schnell', message: 'Levage : Position finale vitesse II (moyenne)', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerksgetriebeumschaltung_Getriebestufe_III_schnell', message: 'Levage : Vitesse III (rapide)', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerksgetriebeumschaltung_Mittelstellung_III', message: 'Levage : Position intermédiaire III', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk2_Hubposition_OK_von_Stromrichter', message: 'Levage 2 : Position OK depuis variateur', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk2_Absicherung_Spannungsversorgung', message: 'Levage 2 : Protection alimentation', type: 'Fault', category: 'Hoist' },
  { tagName: 'Hubwerk1_Getriebeanwahl_Stellung_I_langsam', message: 'Levage 1 : Sélection vitesse I (lente)', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Getriebeanwahl_Stellung_II_Mittel_schnell', message: 'Levage 1 : Sélection vitesse II (moyenne)', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Getriebeanwahl_Stellung_III_schnell', message: 'Levage 1 : Sélection vitesse III (rapide)', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Getriebeanwahl_Stellung_III_Mittelstellung', message: 'Levage 1 : Sélection position intermédiaire III', type: 'Info', category: 'Hoist' },
  { tagName: 'Schaltpunkt_Oldruck_Hubwerksbremse', message: 'Seuil pression huile frein levage 1', type: 'Info', category: 'Hoist' },
  { tagName: 'Schaltpunkt_Staudruck_Hubwerksbremse', message: 'Seuil contre-pression frein levage 1', type: 'Info', category: 'Hoist' },
  { tagName: 'Schaltpunkt_Oldruck_Hubwerk2sbremse', message: 'Seuil pression huile frein levage 2', type: 'Info', category: 'Hoist' },
  { tagName: 'Schaltpunkt_Staudruck_Hubwerk2sbremse', message: 'Seuil contre-pression frein levage 2', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Schnelle_Getriebestufe_aktiv', message: 'Levage 1 : Vitesse rapide active', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Mittlere_Getriebestufe_aktiv', message: 'Levage 1 : Vitesse moyenne active', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Langsame_Getriebestufe_aktiv', message: 'Levage 1 : Vitesse lente active', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Freigabe_Fahrkommando_Heben', message: 'Levage 1 : Autorisation commande monter', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Freigabe_Fahrkommando_Senken', message: 'Levage 1 : Autorisation commande descendre', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk2_Freigabe_Fahrkommando_Heben', message: 'Levage 2 : Autorisation commande monter', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk2_Freigabe_Fahrkommando_Senken', message: 'Levage 2 : Autorisation commande descendre', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Anwahl_Umschaltung_auf_langsame_Getriebestufe_lauft', message: 'Levage 1 : Changement vers vitesse lente en cours', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Anwahl_Umschaltung_auf_schnelle_Getriebestufe_lauft', message: 'Levage 1 : Changement vers vitesse rapide en cours', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Getriebeumschaltung_lauft', message: 'Levage 1 : Changement vitesse en cours', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Uberwachung_Getriebeumschaltung', message: 'Levage 1 : Surveillance changement vitesse', type: 'Warning', category: 'Hoist' },
  { tagName: 'Hubwerk1_Uberwachung_Getriebestellung', message: 'Levage 1 : Surveillance position boîte', type: 'Warning', category: 'Hoist' },
  { tagName: 'Hubwerk1_Freigabe_Getriebeumschaltung', message: 'Levage 1 : Autorisation changement vitesse', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Anwahl_Umschaltung_auf_mittlere_Getriebestufe_lauft', message: 'Levage 1 : Changement vers vitesse moyenne en cours', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_Fehler_Getriebeumschaltung', message: 'Erreur changement de vitesse Levage 1', type: 'Fault', category: 'Hoist' },
  { tagName: 'Hubwerk1_Umschaltung_Hochlaufgeber', message: 'Levage 1 : Commutation générateur rampe', type: 'Info', category: 'Hoist' },
  { tagName: 'Hubwerk1_IBN_Freigabe_Motor_Id_Messung', message: 'Levage 1 : Mise en service mesure ID moteur', type: 'Info', category: 'Hoist' },

  // Slewing Drive (Orientation)
  { tagName: 'Entrainement_mecanisme_d_orientation', message: 'Entraînement mécanisme d\'orientation', type: 'Info', category: 'Slewing' },
  { tagName: 'TK_Steuerhebel_Drehwerk_Lenken_Nach_links', message: 'Levier commande : Orientation vers gauche', type: 'Info', category: 'Slewing' },
  { tagName: 'TK_Steuerhebel_Drehwerk_Lenken_Nach_rechts', message: 'Levier commande : Orientation vers droite', type: 'Info', category: 'Slewing' },
  { tagName: 'TK_Totmanntaste_Drehwerk_Wippwerk', message: 'Bouton homme mort : Orientation/Volée', type: 'Info', category: 'Slewing' },
  { tagName: 'TK_Totmannsensor_Spohn_Drehwerk_Wippwerk', message: 'Capteur homme mort Spohn : Orientation/Volée', type: 'Info', category: 'Slewing' },
  { tagName: 'FS_TK_Steuerhebel_Drehwerk_Lenkung_Nullstellung', message: 'Levier Orientation/Direction en position neutre', type: 'Info', category: 'Slewing' },
  { tagName: 'Futaste_Hakenschwenkwerk_Rechts_drehen', message: 'Pédale : Rotation crochet vers droite', type: 'Info', category: 'Slewing' },
  { tagName: 'Futaste_Hakenschwenkwerk_Links_drehen', message: 'Pédale : Rotation crochet vers gauche', type: 'Info', category: 'Slewing' },
  { tagName: 'Hakenschwenkwerk_Rechts_drehen', message: 'Rotation crochet vers droite', type: 'Info', category: 'Slewing' },
  { tagName: 'Hakenschwenkwerk_Links_drehen', message: 'Rotation crochet vers gauche', type: 'Info', category: 'Slewing' },
  { tagName: 'Hakenschwenkwerk_Haken_verriegelt_entriegelt', message: 'État verrouillage/déverrouillage crochet', type: 'Info', category: 'Slewing' },
  { tagName: 'Schaltpunkt_Oldruck_Drehwerksbremse_1', message: 'Seuil pression huile frein orientation 1', type: 'Info', category: 'Slewing' },
  { tagName: 'Schaltpunkt_Oldruck_Drehwerksbremse_2', message: 'Seuil pression huile frein orientation 2', type: 'Info', category: 'Slewing' },
  { tagName: 'Schaltpunkt_Oldruck_Drehwerksbremse_3', message: 'Seuil pression huile frein orientation 3', type: 'Info', category: 'Slewing' },

  // Luffing (Volée)
  { tagName: 'TK_Steuerhebel_Wippen_Einwippen', message: 'Levier commande : Volée - Relevage', type: 'Info', category: 'Luffing' },
  { tagName: 'TK_Steuerhebel_Wippen_Auswippen', message: 'Levier commande : Volée - Abaissement', type: 'Info', category: 'Luffing' },
  { tagName: 'FS_TK_Steuerhebel_Wippwerk_Bremse_Nullstellung', message: 'Levier Volée/Frein en position neutre', type: 'Info', category: 'Luffing' },
  { tagName: 'Wippwerk_Taste_Abgleich_Radius', message: 'Touche calibrage rayon de volée', type: 'Info', category: 'Luffing' },
  { tagName: 'Wippwerk_Richtungsventil_Einwippen_Auswippen', message: 'Valve direction relevage/abaissement volée', type: 'Info', category: 'Luffing' },
  { tagName: 'Wippwerk_Differentialventil', message: 'Valve différentielle volée', type: 'Info', category: 'Luffing' },
  { tagName: 'Wippwerk_Sperrventil_Kolbenboden', message: 'Valve de blocage fond piston volée', type: 'Info', category: 'Luffing' },
  { tagName: 'FS_Wippwerk_Freigabe_Sperrventil_Y24_bei_GHxK2_Y21_Sperrventil_Stangenseite', message: 'Autorisation valve blocage Y24/Y21 côté tige', type: 'Info', category: 'Luffing' },
  { tagName: 'FS_Wippwerk_Freigabe_Stangenseite_Eingangsventil_GHxK2', message: 'Autorisation valve entrée côté tige', type: 'Info', category: 'Luffing' },
  { tagName: 'Wippwerk_Magnetventil_Tankrucklauf', message: 'Électrovanne retour réservoir volée', type: 'Info', category: 'Luffing' },
  { tagName: 'Datensatz_5_WW_Tandemlift', message: 'Jeu données 5 : Volée Tandemlift', type: 'Info', category: 'Luffing' },
  { tagName: 'Datensatz_3_WW_langsam', message: 'Jeu données 3 : Volée lente', type: 'Info', category: 'Luffing' },
  { tagName: 'Datensatz_4_WW_Personentransport', message: 'Jeu données 4 : Transport de personnes', type: 'Info', category: 'Luffing' },
  { tagName: 'Datensatz_2_WW_mittel', message: 'Jeu données 2 : Volée moyenne', type: 'Info', category: 'Luffing' },
  { tagName: 'Datensatz_1_WW_schnell', message: 'Jeu données 1 : Volée rapide', type: 'Info', category: 'Luffing' },
  { tagName: 'Datensatz_6_WW_Reserve', message: 'Jeu données 6 : Volée réserve', type: 'Info', category: 'Luffing' },
  { tagName: 'Kommando_Wippwerk_Einwippen_bis_Nullmeldung_Hydraulikpumpe', message: 'Cmd Volée : Relevage jusqu\'à zéro pompe hydraulique', type: 'Info', category: 'Luffing' },
  { tagName: 'Kommando_Wippwerk_Auswippen_bis_Nullmeldung_Hydraulikpumpe', message: 'Cmd Volée : Abaissement jusqu\'à zéro pompe hydraulique', type: 'Info', category: 'Luffing' },
  { tagName: 'Kommando_Wippwerk_Ausleger_ablegen_bis_Nullmeldung_Hydraulikpumpe', message: 'Cmd Volée : Pose flèche jusqu\'à zéro pompe hydraulique', type: 'Info', category: 'Luffing' },
  { tagName: 'Kommando_Wippwerk_Ausleger_anheben_bis_Nullmeldung_Hydraulikpumpe', message: 'Cmd Volée : Lever flèche jusqu\'à zéro pompe hydraulique', type: 'Info', category: 'Luffing' },
  { tagName: 'Wippwerk_Freigabe_Fahrkommando_Einwippen', message: 'Volée : Autorisation commande relevage', type: 'Info', category: 'Luffing' },
  { tagName: 'Wippwerk_Freigabe_Fahrkommando_Auswippen', message: 'Volée : Autorisation commande abaissement', type: 'Info', category: 'Luffing' },
  { tagName: 'Selection_mecanisme_de_volee', message: 'Sélection mécanisme de volée', type: 'Info', category: 'Luffing' },

  // Travel (Translation)
  { tagName: 'Schienenbremse_rechts_Oldruck_erreicht_0', message: 'Défaut Pression : Frein Rail Droit', type: 'Alarm', category: 'Travel' },
  { tagName: 'Schienenbremse_links_Oldruck_erreicht_0', message: 'Défaut Pression : Frein Rail Gauche', type: 'Alarm', category: 'Travel' },
  { tagName: 'Entrainement_mec_translation_electrique', message: 'Entraînement translation électrique', type: 'Info', category: 'Travel' },
  { tagName: 'FFB_Vorwahlschalter_Stellung_1_Fahrwerk', message: 'Présélecteur radio position 1 : Translation', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Freigabe_Tippbetrieb_Bedienpult', message: 'Translation : Mode impulsion pupitre activé', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Tippen_vorwarts', message: 'Translation : Impulsion avant', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Tippen_ruckwarts', message: 'Translation : Impulsion arrière', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Versorgungsspannung_Lenkungssteuerung', message: 'Tension alimentation commande direction', type: 'Info', category: 'Travel' },
  { tagName: 'Druckloser_Umlauf_Fahrwerk_links_GHRK2', message: 'Circuit sans pression translation gauche', type: 'Info', category: 'Travel' },
  { tagName: 'Druckloser_Umlauf_Fahrwerk_rechts_GHRK2', message: 'Circuit sans pression translation droite', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Q_Max_Motor', message: 'Translation : Débit max moteur', type: 'Info', category: 'Travel' },
  { tagName: 'Schaltpunkt_Oldruck_Fahrwerk_Betriebsbremse', message: 'Seuil pression huile frein service translation', type: 'Info', category: 'Travel' },
  { tagName: 'Schaltpunkt_Oldruck_Fahrwerk_Druckuberwachung', message: 'Seuil surveillance pression translation', type: 'Info', category: 'Travel' },
  { tagName: 'Schaltpunkt_Oldruck_Fahrwerk_Standbremse', message: 'Seuil pression huile frein parking translation', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Fahren_schnell', message: 'Translation : Mode rapide', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Fahren_mittel', message: 'Translation : Mode moyen', type: 'Info', category: 'Travel' },
  { tagName: 'Fahrwerk_Fahren_langsam', message: 'Translation : Mode lent', type: 'Info', category: 'Travel' },
  { tagName: 'Schienenbremsen_geoffnet', message: 'Freins sur rails ouverts', type: 'Info', category: 'Travel' },
  { tagName: 'Selection_mode_translation_ou_mode_calage', message: 'Sélection mode translation ou calage', type: 'Info', category: 'Travel' },
  { tagName: 'Validation_mec_translation_electrique', message: 'Validation mécanisme translation électrique', type: 'Info', category: 'Travel' },

  // Chassis Status
  { tagName: 'Kran_abgestutzt', message: 'Grue entièrement calée (Stabilisateurs OK)', type: 'Info', category: 'Chassis' },
  { tagName: 'Oberwagen_und_Unterwagen_verriegelt', message: 'Chassis et Tourelle Verrouillés', type: 'Info', category: 'Chassis' },
  { tagName: 'Sturmbolzen_entriegelt', message: 'Verrous tempête déverrouillés (Prêt à rouler)', type: 'Info', category: 'Chassis' },
  { tagName: 'Fahrwerk_Schienenbremse_rechts_geoffnet', message: 'Frein sur rail droit : OUVERT', type: 'Info', category: 'Chassis' },
  { tagName: 'Fahrwerk_Schienenbremse_links_geoffnet', message: 'Frein sur rail gauche : OUVERT', type: 'Info', category: 'Chassis' },
  { tagName: 'Chassis', message: 'État châssis', type: 'Info', category: 'Chassis' },
  { tagName: 'Passerelle_CAN_chassis', message: 'Passerelle CAN châssis', type: 'Info', category: 'Chassis' },

  // Cable Reel
  { tagName: 'Fahrleitungstrommel_leer', message: 'Attention : Enrouleur câble VIDE', type: 'Warning', category: 'Electrical' },
  { tagName: 'Fahrleitungstrommel_voll', message: 'Info : Enrouleur câble PLEIN', type: 'Info', category: 'Electrical' },

  // Remote Control
  { tagName: 'FFB_Not_Aus_Taste_nicht_betatigt', message: 'Arrêt Urgence Radio : OK (Non actionné)', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meldung_Hauptschaler_Ein', message: 'Interrupteur principal Radio : ON', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Eingeschaltet', message: 'Radiocommande Connectée', type: 'Info', category: 'Remote Control' },

  // Additional Electrical
  { tagName: 'Absicherung_Beleuchtung_Unterwagen_HSK', message: 'Défaut Fusible : Eclairage Chassis', type: 'Fault', category: 'Electrical' },
  { tagName: 'Kranhauptnetz_Spannung_vorhanden', message: 'Tension Secteur Principale Présente', type: 'Info', category: 'Electrical' },
  { tagName: 'RCLD_Absicherung', message: 'Protection RCLD', type: 'Fault', category: 'Electrical' },
  { tagName: 'Reserve_DC', message: 'Réserve DC', type: 'Info', category: 'Electrical' },
  { tagName: 'Hilfseinspeisung_Extern', message: 'Alimentation auxiliaire externe', type: 'Info', category: 'Electrical' },
  { tagName: 'VAR_Absicherung_115V_Steckdose_Unterwagen', message: 'Protection prise 115V châssis', type: 'Fault', category: 'Electrical' },
  { tagName: 'Arbeitsplatzbeleuchtung_Portal_vorne_rechts', message: 'Éclairage portique avant droite', type: 'Info', category: 'Electrical' },
  { tagName: 'Arbeitsplatzbeleuchtung_Portal_vorne_links', message: 'Éclairage portique avant gauche', type: 'Info', category: 'Electrical' },
  { tagName: 'Arbeitsplatzbeleuchtung_Portal_hinten_links', message: 'Éclairage portique arrière gauche', type: 'Info', category: 'Electrical' },

  // Remote Control (FFB) - Extended
  { tagName: 'Manipulateur_a_droite', message: 'Manipulateur à droite', type: 'Info', category: 'Remote Control' },
  { tagName: 'Manipulateur_a_gauche', message: 'Manipulateur à gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'Salle_electrique_0', message: 'Salle électrique 0', type: 'Info', category: 'Remote Control' },
  { tagName: 'Salle_electrique_1', message: 'Salle électrique 1', type: 'Info', category: 'Remote Control' },
  { tagName: 'Salle_electrique_2', message: 'Salle électrique 2', type: 'Info', category: 'Remote Control' },
  { tagName: 'Control_Unit', message: 'Unité de contrôle', type: 'Info', category: 'Remote Control' },
  { tagName: 'Cabine_de_tour', message: 'Cabine de tour', type: 'Info', category: 'Remote Control' },
  { tagName: 'Radiotelecommande', message: 'Radiotélécommande', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Hauptschalter_Ein', message: 'FFB : Interrupteur principal ON', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Hauptschalter_Aus', message: 'FFB : Interrupteur principal OFF', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Hupe', message: 'FFB : Touche klaxon', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Arbeitsplatzbeleuchtung', message: 'FFB : Éclairage poste de travail', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_links_gelb', message: 'FFB : Touche gauche jaune', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_links_grun', message: 'FFB : Touche gauche verte', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_links_rot', message: 'FFB : Touche gauche rouge', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_links_blau', message: 'FFB : Touche gauche bleue', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_rechts_gelb', message: 'FFB : Touche droite jaune', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_rechts_grun', message: 'FFB : Touche droite verte', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_rechts_rot', message: 'FFB : Touche droite rouge', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_rechts_blau', message: 'FFB : Touche droite bleue', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_zuruck_back', message: 'FFB : Touche retour', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Schlusselschalter_Aus', message: 'FFB : Interrupteur à clé OFF', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Schlusselschalter_Ein', message: 'FFB : Interrupteur à clé ON', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_SI2_Sicherheitskanal', message: 'FFB : Canal de sécurité SI2', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Enter', message: 'FFB : Touche Entrée', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Abstutzung_Automatik', message: 'FFB : Calage automatique', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Abstutzung_Hand', message: 'FFB : Calage manuel', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Getriebestufe_schnell', message: 'FFB : Vitesse rapide', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Getriebestufe_langsam', message: 'FFB : Vitesse lente', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Ober_Unterwagen_verriegeln', message: 'FFB : Verrouiller tourelle/châssis', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Ober_Unterwagen_entriegeln', message: 'FFB : Déverrouiller tourelle/châssis', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Multifunktion_Aus', message: 'FFB : Multifonction OFF', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Multifunktion_Ein', message: 'FFB : Multifonction ON', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Spreader_entriegeln', message: 'FFB : Déverrouiller spreader', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Taste_Spreader_verriegeln', message: 'FFB : Verrouiller spreader', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Vorwahlschalter_Stellung_2_Abstutzung', message: 'FFB : Sélecteur pos. 2 Calage', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Vorwahlschalter_Stellung_3_Kranbetrieb', message: 'FFB : Sélecteur pos. 3 Grue', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Vorwahlschalter_Stellung_4_Motorleitungstrommell_Ausleger', message: 'FFB : Sélecteur pos. 4 Enrouleur', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Vorwahlschalter_Stellung_5_Lastaufnahmemittel', message: 'FFB : Sélecteur pos. 5 Accessoire', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Vorwahlschalter_Stellung_6_Sonderfunktion_1', message: 'FFB : Sélecteur pos. 6 Spécial 1', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Vorwahlschalter_Stellung_7_Sonderfunktion_2', message: 'FFB : Sélecteur pos. 7 Spécial 2', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_links_Y_Achse_Richtungskontakt_vorwarts', message: 'FFB : Joystick G axe Y avant', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_links_Y_Achse_Richtungskontakt_ruckwarts', message: 'FFB : Joystick G axe Y arrière', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_links_X_Achse_Richtungskontakt_links', message: 'FFB : Joystick G axe X gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_links_X_Achse_Richtungskontakt_rechts', message: 'FFB : Joystick G axe X droite', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_links_Z_Achse_Richtungskontakt_gegen_Uhrzeigersinn', message: 'FFB : Joystick G axe Z anti-horaire', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_links_Z_Achse_Richtungskontakt_Uhrzeigersinn', message: 'FFB : Joystick G axe Z horaire', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_rechts_Y_Achse_Richtungskontakt_vorwarts', message: 'FFB : Joystick D axe Y avant', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_rechts_Y_Achse_Richtungskontakt_ruckwarts', message: 'FFB : Joystick D axe Y arrière', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_rechts_X_Achse_Richtungskontakt_links', message: 'FFB : Joystick D axe X gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_rechts_X_Achse_Richtungskontakt_rechts', message: 'FFB : Joystick D axe X droite', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_rechts_Z_Achse_Richtungskontakt_gegen_Uhrzeigersinn', message: 'FFB : Joystick D axe Z anti-horaire', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meisterschalter_rechts_Z_Achse_Richtungskontakt_Uhrzeigersinn', message: 'FFB : Joystick D axe Z horaire', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Display_auf_Raster_2_schalten', message: 'FFB : Basculer affichage grille 2', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Meldung_Hauptschaler_Aus', message: 'FFB : Message interrupteur OFF', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Summer', message: 'FFB : Buzzer', type: 'Info', category: 'Remote Control' },
  { tagName: 'FFB_Hintergrundbeleuchtung_Displays_Ein', message: 'FFB : Rétroéclairage écran ON', type: 'Info', category: 'Remote Control' },

  // Tower Cabin Controls (TK)
  { tagName: 'TK_Taste_blau_Meisterschalter_rechts', message: 'TK : Touche bleue joystick droit', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_gelb_Meisterschalter_rechts', message: 'TK : Touche jaune joystick droit', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_grun_Meisterschalter_rechts', message: 'TK : Touche verte joystick droit', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_rot_Meisterschalter_rechts', message: 'TK : Touche rouge joystick droit', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_innen_schwarz_Meisterschalter_rechts', message: 'TK : Touche noire int. joystick droit', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_auen_schwarz_Meisterschalter_rechts', message: 'TK : Touche noire ext. joystick droit', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_blau_Meisterschalter_links', message: 'TK : Touche bleue joystick gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_gelb_Meisterschalter_links', message: 'TK : Touche jaune joystick gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_grun_Meisterschalter_links', message: 'TK : Touche verte joystick gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_rot_Meisterschalter_links', message: 'TK : Touche rouge joystick gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_auen_schwarz_Meisterschalter_links', message: 'TK : Touche noire ext. joystick gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'TK_Taste_innen_schwarz_Meisterschalter_links', message: 'TK : Touche noire int. joystick gauche', type: 'Info', category: 'Remote Control' },
  { tagName: 'Freigabe_Bedienung_Turmkabine', message: 'Autorisation commande cabine tour', type: 'Info', category: 'Remote Control' },
  { tagName: 'Taste_Kranhauptschalter_EIN_Turmkabine', message: 'Interrupteur principal grue ON cabine', type: 'Info', category: 'Remote Control' },

  // Spreader & Load Handling - Extended
  { tagName: 'VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt', message: 'Spreader Twinlift connecté', type: 'Info', category: 'Spreader' },
  { tagName: 'VAR_Twin_detection_system', message: 'Système détection Twin actif', type: 'Info', category: 'Spreader' },
  { tagName: 'Twistlocks_verriegeln', message: 'Commande verrouiller Twistlocks', type: 'Info', category: 'Spreader' },
  { tagName: 'Twistlocks_entriegeln', message: 'Commande déverrouiller Twistlocks', type: 'Info', category: 'Spreader' },
  { tagName: 'Spreader_Schwerpunktausgleich_Richtung_blauer_Flipper', message: 'Équilibrage COG vers flipper bleu', type: 'Info', category: 'Spreader' },
  { tagName: 'Spreader_Schwerpunktausgleich_Richtung_gelber_Flipper', message: 'Équilibrage COG vers flipper jaune', type: 'Info', category: 'Spreader' },
  { tagName: 'Spreaderverstellung_auf_20', message: 'Réglage spreader 20 pieds', type: 'Info', category: 'Spreader' },
  { tagName: 'Spreaderverstellung_auf_40', message: 'Réglage spreader 40 pieds', type: 'Info', category: 'Spreader' },
  { tagName: 'Spreaderverstellung_30_Twins_anheben', message: 'Spreader 30 Twins lever', type: 'Info', category: 'Spreader' },
  { tagName: 'Spreaderverstellung_35_Twins_absenken', message: 'Spreader 35 Twins baisser', type: 'Info', category: 'Spreader' },
  { tagName: 'Alle_Flipper_auf', message: 'Tous flippers relevés', type: 'Info', category: 'Spreader' },
  { tagName: 'Flipper_grun_ab', message: 'Flipper vert abaissé', type: 'Info', category: 'Spreader' },
  { tagName: 'Flipper_gelb_ab', message: 'Flipper jaune abaissé', type: 'Info', category: 'Spreader' },
  { tagName: 'Flipper_blau_ab', message: 'Flipper bleu abaissé', type: 'Info', category: 'Spreader' },
  { tagName: 'Flipper_rot_ab', message: 'Flipper rouge abaissé', type: 'Info', category: 'Spreader' },
  { tagName: 'Anwahl_LMB_Test', message: 'Sélection test LMB', type: 'Info', category: 'Spreader' },
  { tagName: 'Vierseilgreiferbetrieb', message: 'Mode grappin 4 câbles', type: 'Info', category: 'Spreader' },
  { tagName: 'Motorgreiferbetrieb', message: 'Mode grappin motorisé', type: 'Info', category: 'Spreader' },

  // Outriggers (Abstutzung) & Stability
  { tagName: 'Uberbruckung_fur_Notbetatigung_Abstutzung', message: 'Pontage urgence calage', type: 'Warning', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_links_rot_abgetutzt', message: 'Porteur AV gauche (rouge) calé', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_links_rot_ausgefahren', message: 'Porteur AV gauche (rouge) sorti', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_links_rot_eingefahren', message: 'Porteur AV gauche (rouge) rentré', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_links_rot_ausgefahren_Basis_2', message: 'Porteur AV gauche (rouge) sorti base 2', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_rechts_blau_abgetutzt', message: 'Porteur AV droit (bleu) calé', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_rechts_blau_ausgefahren', message: 'Porteur AV droit (bleu) sorti', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_rechts_blau_eingefahren', message: 'Porteur AV droit (bleu) rentré', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_vorne_rechts_blau_ausgefahren_Basis_2', message: 'Porteur AV droit (bleu) sorti base 2', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_rechts_gelb_abgestutzt', message: 'Porteur AR droit (jaune) calé', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_rechts_gelb_ausgefahren', message: 'Porteur AR droit (jaune) sorti', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_rechts_gelb_eingefahren', message: 'Porteur AR droit (jaune) rentré', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_rechts_gelb_ausgefahren_Basis_2', message: 'Porteur AR droit (jaune) sorti base 2', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_links_grun_abgestutzt', message: 'Porteur AR gauche (vert) calé', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_links_grun_ausgefahren', message: 'Porteur AR gauche (vert) sorti', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_links_grun_eingefahren', message: 'Porteur AR gauche (vert) rentré', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutztrager_hinten_links_grun_ausgefahren_Basis_2', message: 'Porteur AR gauche (vert) sorti base 2', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_vorne_links_rot_abstutzen', message: 'Plateau AV gauche (rouge) caler', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_vorne_links_rot_anheben', message: 'Plateau AV gauche (rouge) lever', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_hinten_links_grun_abstutzen', message: 'Plateau AR gauche (vert) caler', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_hinten_links_grun_anheben', message: 'Plateau AR gauche (vert) lever', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_vorne_rechts_blau_abstutzen', message: 'Plateau AV droit (bleu) caler', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_vorne_rechts_blau_anheben', message: 'Plateau AV droit (bleu) lever', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_hinten_rechts_gelb_abstutzen', message: 'Plateau AR droit (jaune) caler', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzplatte_hinten_rechts_gelb_anheben', message: 'Plateau AR droit (jaune) lever', type: 'Info', category: 'Outriggers' },
  { tagName: 'Abstutzung_Mechanisch_Stop_mit_Hauptschutz', message: 'Calage arrêt mécanique avec protection', type: 'Warning', category: 'Outriggers' },
  { tagName: 'Kommando_Automatikbetrieb_Abstutzung_Einfahren', message: 'Auto : Commande rentrée calage', type: 'Info', category: 'Outriggers' },
  { tagName: 'Kommando_Automatikbetrieb_Abstutzung_Ausfahren', message: 'Auto : Commande sortie calage', type: 'Info', category: 'Outriggers' },
  { tagName: 'Kommando_Automatikbetrieb_Abstutzung_Nivellieren', message: 'Auto : Commande nivellement', type: 'Info', category: 'Outriggers' },
  { tagName: 'Anwahl_Handbetrieb_Abstutzung', message: 'Sélection mode manuel calage', type: 'Info', category: 'Outriggers' },
  { tagName: 'Fahrerkabine_Handbetrieb_Abstutzung', message: 'Cabine : Mode manuel calage', type: 'Info', category: 'Outriggers' },
  { tagName: 'Initiatoren_Abstutzung_gepruft', message: 'Initiateurs calage vérifiés', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_1_Abstutzplatte_vorne_hinten_anheben', message: 'Auto étape 1 : Lever plateaux AV/AR', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_2_Abstutzplatte_vorne_hinten', message: 'Auto étape 2 : Plateaux AV/AR', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_3_Abstutztrager_vorne_einfahren', message: 'Auto étape 3 : Rentrer porteurs AV', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_4_Abstutztrager_hinten_einfahren', message: 'Auto étape 4 : Rentrer porteurs AR', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_1_Abstutztrager_vorne_ausfahren', message: 'Auto étape 1 : Sortir porteurs AV', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_2_Abstutztrager_hinten_ausfahren', message: 'Auto étape 2 : Sortir porteurs AR', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_3_Abstutzplatte_vorne_hinten', message: 'Auto étape 3 : Plateaux AV/AR', type: 'Info', category: 'Outriggers' },
  { tagName: 'Automatikbetrieb_Schritt_4_Abstutzplatte_vorne_und_hinten_nachstutzen', message: 'Auto étape 4 : Recaler plateaux', type: 'Info', category: 'Outriggers' },
  { tagName: 'Validation_calage', message: 'Validation calage', type: 'Info', category: 'Outriggers' },

  // Cable Reel & Power Supply
  { tagName: 'Motorleitungstrommel_Endschalter_Abwickeln', message: 'Enrouleur moteur : Fin course dérouler', type: 'Warning', category: 'Cable Reel' },
  { tagName: 'Motorleitungstrommel_Endschalter_Aufwickeln', message: 'Enrouleur moteur : Fin course enrouler', type: 'Warning', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Freigabe_Handbetrieb', message: 'Enrouleur : Mode manuel autorisé', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Handbetrieb_Aufwickeln', message: 'Enrouleur : Manuel enrouler', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Handbetrieb_Abwickeln', message: 'Enrouleur : Manuel dérouler', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Pendelarm_nach_links', message: 'Enrouleur : Bras pendulaire gauche', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Pendelarm_nach_rechts', message: 'Enrouleur : Bras pendulaire droite', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Kran_neben_Fremdeinspeisepunkt', message: 'Grue près point alimentation externe', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Motor_1_Rechtslauf', message: 'Enrouleur : Moteur 1 sens horaire', type: 'Info', category: 'Cable Reel' },
  { tagName: 'VAR_Fahrleitungstrommel_Motor_2_Rechtslauf', message: 'Enrouleur : Moteur 2 sens horaire', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Motor_1_Linkslauf', message: 'Enrouleur : Moteur 1 sens anti-horaire', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Automatikbetrieb_Fahrleitungstrommel_Kabel_aufwickeln', message: 'Auto : Enrouler câble', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Handbetrieb_Fahrleitungstrommel_Kabel_aufwickeln', message: 'Manuel : Enrouler câble', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Handbetrieb_Fahrleitungstrommel_Kabel_abwickeln', message: 'Manuel : Dérouler câble', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Strammleitung_nach_rechts', message: 'Enrouleur : Tension vers droite', type: 'Info', category: 'Cable Reel' },
  { tagName: 'Fahrleitungstrommel_Strammleitung_nach_links', message: 'Enrouleur : Tension vers gauche', type: 'Info', category: 'Cable Reel' },

  // General System, Safety & Modes
  { tagName: 'Leuchtmelder_Kranhauptschalter_Schaltraum_AUS', message: 'Voyant interrupteur salle OFF', type: 'Info', category: 'System' },
  { tagName: 'Leuchtmelder_Kranhauptschalter_Schaltraum_EIN', message: 'Voyant interrupteur salle ON', type: 'Info', category: 'System' },
  { tagName: 'Reserve', message: 'Réserve', type: 'Info', category: 'System' },
  { tagName: 'Systeme_anti_ballant', message: 'Système anti-balancement', type: 'Info', category: 'System' },
  { tagName: 'Tambour_a_cable', message: 'Tambour à câble', type: 'Info', category: 'System' },
  { tagName: 'Bus_ASI_superstructure', message: 'Bus ASI superstructure', type: 'Info', category: 'System' },
  { tagName: 'Passerelle_CAN_superstructure', message: 'Passerelle CAN superstructure', type: 'Info', category: 'System' },
  { tagName: 'Passerelle_CAN_PowerCaps', message: 'Passerelle CAN PowerCaps', type: 'Info', category: 'System' },
  { tagName: 'CPU_CEC', message: 'CPU CEC', type: 'Info', category: 'System' },
  { tagName: 'Salle_electrique_Safety', message: 'Salle électrique Safety', type: 'Info', category: 'System' },
  { tagName: 'EKS_cabine_de_tour', message: 'EKS cabine de tour', type: 'Info', category: 'System' },
  { tagName: 'EKS_superstructure', message: 'EKS superstructure', type: 'Info', category: 'System' },
  { tagName: 'Uberbruckung_Wegbegrenzung', message: 'Pontage limitation course', type: 'Warning', category: 'System' },
  { tagName: 'Profibus_DP_Quittierung', message: 'Acquittement Profibus DP', type: 'Info', category: 'System' },
  { tagName: 'ASI_Bus_Quittierung', message: 'Acquittement Bus ASI', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_1_50_bar', message: 'Hydraulique : Niveau pression 1 (50 bar)', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_2_angewahlt', message: 'Hydraulique : Niveau pression 2 sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_3_angewahlt', message: 'Hydraulique : Niveau pression 3 sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_4_angewahlt', message: 'Hydraulique : Niveau pression 4 sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_5_angewahlt', message: 'Hydraulique : Niveau pression 5 sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_6_angewahlt', message: 'Hydraulique : Niveau pression 6 sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_7_angewahlt', message: 'Hydraulique : Niveau pression 7 sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Druckstufe_8_angewahlt', message: 'Hydraulique : Niveau pression 8 sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Druckstufe_50bar', message: 'Niveau pression 50 bar', type: 'Info', category: 'System' },
  { tagName: 'Sturmbolzen_rechts_entriegelt', message: 'Verrou tempête droit déverrouillé', type: 'Info', category: 'System' },
  { tagName: 'Sturmbolzen_links_entriegelt', message: 'Verrou tempête gauche déverrouillé', type: 'Info', category: 'System' },
  { tagName: 'Validation_broche_anti_tempete', message: 'Validation broche anti-tempête', type: 'Info', category: 'System' },
  { tagName: 'Validation_capteurs_Sonar', message: 'Validation capteurs sonar', type: 'Info', category: 'System' },
  { tagName: 'Validation_fin_de_course_tampon', message: 'Validation fin de course tampon', type: 'Info', category: 'System' },
  { tagName: 'Validation_geler_generateur_de_rampe', message: 'Validation geler générateur rampe', type: 'Info', category: 'System' },
  { tagName: 'Validation_premiere_mise_en_service_Pompe_hydraulique_principale', message: 'Validation 1ère mise en service pompe', type: 'Info', category: 'System' },
  { tagName: 'Validation_reduction_de_la_puissance', message: 'Validation réduction puissance', type: 'Info', category: 'System' },
  { tagName: 'Leistungsgrenze_Hochlaufgeber_anhalten', message: 'Limite puissance : Arrêter rampe', type: 'Warning', category: 'System' },
  { tagName: 'Leistungsgrenzwert_1', message: 'Limite puissance niveau 1', type: 'Warning', category: 'System' },
  { tagName: 'Leistungsgrenzwert_2', message: 'Limite puissance niveau 2', type: 'Warning', category: 'System' },
  { tagName: 'Leistungsreduzierung_Stufe_2', message: 'Réduction puissance niveau 2', type: 'Warning', category: 'System' },
  { tagName: 'Leistungsreduzierung_Stufe_1', message: 'Réduction puissance niveau 1', type: 'Warning', category: 'System' },
  { tagName: 'Leistungsgrenzwert_Hochlaufgeber_auf_lange_Rampe_schalten', message: 'Limite : Basculer sur rampe longue', type: 'Info', category: 'System' },
  { tagName: 'Netzbetrieb', message: 'Mode secteur', type: 'Info', category: 'System' },
  { tagName: 'Generatorbetrieb', message: 'Mode générateur', type: 'Info', category: 'System' },
  { tagName: 'Stillstand_aller_Antriebe', message: 'Tous entraînements à l\'arrêt', type: 'Info', category: 'System' },
  { tagName: 'Hydraulik_Hydraulikpumpe_n_in_Betrieb', message: 'Pompe(s) hydraulique(s) en service', type: 'Info', category: 'System' },
  { tagName: 'Connexion_test_CEC_pour_les_courbes_de_charge_possible_uniquement_dans_lAPI', message: 'Test CEC courbes charge API uniquement', type: 'Info', category: 'System' },
  { tagName: 'Enregistrer_test_de_charge_1_reglage_0_tonne_crochet_vide', message: 'Test charge 1 : Réglage 0t crochet vide', type: 'Info', category: 'System' },
  { tagName: 'Enregistrer_test_de_charge_2_ajustement_pour_charge_maximale', message: 'Test charge 2 : Ajustement charge max', type: 'Info', category: 'System' },
  { tagName: 'Validation_ajustement_des_charges_dessai', message: 'Validation ajustement charges essai', type: 'Info', category: 'System' },
  { tagName: 'Krantyp_GHMK', message: 'Type grue : GHMK', type: 'Info', category: 'System' },
  { tagName: 'Krantyp_GHSK', message: 'Type grue : GHSK', type: 'Info', category: 'System' },
  { tagName: 'Krantyp_GHPK', message: 'Type grue : GHPK', type: 'Info', category: 'System' },
  { tagName: 'Wartungsbetrieb_angewahlt', message: 'Mode maintenance sélectionné', type: 'Info', category: 'System' },
  { tagName: 'Oberwagen_und_Unterwagen_verriegeln', message: 'Verrouiller tourelle/châssis', type: 'Info', category: 'Chassis' },
  { tagName: 'Oberwagen_und_Unterwagen_entriegeln', message: 'Déverrouiller tourelle/châssis', type: 'Info', category: 'Chassis' },
  { tagName: 'Oberwagen_und_Unterwagen_entriegelt', message: 'Tourelle/châssis déverrouillés', type: 'Info', category: 'Chassis' },
  { tagName: 'Geradeausstellung_Oberwagen_Nach_vorne', message: 'Tourelle alignée vers l\'avant', type: 'Info', category: 'Chassis' },
  { tagName: 'Geradeausstellung_Oberwagen_Nach_hinten', message: 'Tourelle alignée vers l\'arrière', type: 'Info', category: 'Chassis' },
  { tagName: 'Oberwagen_in_Geradeausstellung', message: 'Tourelle en position alignée', type: 'Info', category: 'Chassis' },
  { tagName: 'Umschaltung_UW_Hauptpumpen', message: 'Commutation pompes principales châssis', type: 'Info', category: 'Chassis' },
  { tagName: 'Umschaltung_UW_Lenkpumpe_1', message: 'Commutation pompe direction 1 châssis', type: 'Info', category: 'Chassis' },
  { tagName: 'Umschaltung_UW_Lenkpumpe_2', message: 'Commutation pompe direction 2 châssis', type: 'Info', category: 'Chassis' },
  { tagName: 'VAR_Fremdeinspeisung_Temperaturuberwachung_Trafowicklung_Abschaltung', message: 'Arrêt surchauffe enroulement transfo externe', type: 'Critical', category: 'Electrical' }
];

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HistoryPanelComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;
  private notificationId = 0;

  // Filter states
  typeFilter: string = 'all';
  categoryFilter: string = 'all';
  showActiveOnly: boolean = false;
  searchText: string = '';

  // Categories from tags
  categories: string[] = [...new Set(NOTIFICATION_TAGS.map(t => t.category))];

  // Active notifications
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];

  // Track previous tag states
  private previousStates: Map<string, boolean> = new Map();

  // ===================== HISTORY MODE =====================
  isHistoryMode: boolean = false;
  historyTimeRange: TimeRange | null = null;
  isLoadingHistory: boolean = false;
  historyError: string = '';
  historyNotifications: Notification[] = [];
  historyPage: number = 1;
  historyTotalPages: number = 0;

  // ===================== PLAYBACK CONTROLS =====================
  isPlaying: boolean = false;
  playbackSpeed: number = 1;
  playbackIndex: number = 0;
  allHistoryNotifications: Notification[] = [];
  playbackTimestamps: Date[] = [];
  currentPlaybackTime: Date | null = null;
  private playbackInterval: any = null;

  // Get notification tag names for history queries
  private readonly NOTIFICATION_TAG_NAMES = NOTIFICATION_TAGS.map(t => t.tagName);

  constructor(
    private route: ActivatedRoute,
    private _mqttService: MqttService,
    private cdr: ChangeDetectorRef,
    private historyService: HistoryService
  ) { }

  ngOnInit(): void {
    this.connectToMqtt();
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
      if (this.subscription) {
        this.subscription.unsubscribe();
        this.subscription = null;
      }
    } else {
      this.stopPlayback();
      this.historyNotifications = [];
      this.allHistoryNotifications = [];
      this.connectToMqtt();
    }
  }

  onTimeRangeChange(range: TimeRange): void {
    this.historyTimeRange = range;
    this.historyPage = 1;
    if (this.isHistoryMode) {
      this.fetchHistoricalNotifications();
    }
  }

  fetchHistoricalNotifications(page: number = 1): void {
    if (!this.historyTimeRange) return;

    this.isLoadingHistory = true;
    this.historyError = '';
    this.historyPage = page;
    this.stopPlayback();

    // Fetch more data for playback (up to 500 records)
    const limit = 500;
    const offset = 0;

    this.historyService.getNotificationHistory(
      this.historyTimeRange.startTime,
      this.historyTimeRange.endTime,
      this.NOTIFICATION_TAG_NAMES,
      limit,
      offset
    ).subscribe({
      next: (response) => {
        this.isLoadingHistory = false;
        this.historyTotalPages = response.totalPages;

        // Convert history data to notification format
        this.allHistoryNotifications = response.data.map((point, index) => {
          const tagDef = NOTIFICATION_TAGS.find(t => t.tagName === point.name);
          return {
            id: index + 1,
            tagName: point.name,
            timestamp: new Date(point.ts),
            message: tagDef?.message || point.name,
            type: tagDef?.type || 'Info',
            category: tagDef?.category || 'System',
            isRead: true,
            isActive: point.value === 'true' || point.value === '1'
          } as Notification;
        });

        // Sort by timestamp
        this.allHistoryNotifications.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // Extract unique timestamps
        const timestampSet = new Set<number>();
        this.allHistoryNotifications.forEach(n => timestampSet.add(n.timestamp.getTime()));
        this.playbackTimestamps = Array.from(timestampSet)
          .sort((a, b) => a - b)
          .map(ts => new Date(ts));

        if (this.allHistoryNotifications.length === 0) {
          this.historyError = 'No notifications found for the selected time range';
        } else {
          // Start playback
          this.playbackIndex = 0;
          this.updatePlaybackFrame();
          this.startPlayback();
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoadingHistory = false;
        this.historyError = 'Failed to fetch historical notifications';
        console.error('History fetch error:', error);
        this.cdr.detectChanges();
      }
    });
  }

  // ===================== PLAYBACK CONTROLS =====================
  startPlayback(): void {
    if (this.playbackTimestamps.length === 0) return;
    this.isPlaying = true;
    const intervalMs = 1000 / this.playbackSpeed;
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

    // Filter notifications up to the current playback time
    this.historyNotifications = this.allHistoryNotifications.filter(
      n => n.timestamp.getTime() <= targetTime
    ).slice(-20); // Show last 20 notifications up to this point

    this.cdr.detectChanges();
  }

  getPlaybackProgress(): number {
    if (this.playbackTimestamps.length === 0) return 0;
    return (this.playbackIndex / (this.playbackTimestamps.length - 1)) * 100;
  }

  loadNextPage(): void {
    if (this.historyPage < this.historyTotalPages) {
      this.fetchHistoricalNotifications(this.historyPage + 1);
    }
  }

  loadPrevPage(): void {
    if (this.historyPage > 1) {
      this.fetchHistoricalNotifications(this.historyPage - 1);
    }
  }

  connectToMqtt(): void {
    try {
      this.subscription = this._mqttService.observe('site/pi5/generator/snapshot').subscribe({
        next: (message: IMqttMessage) => {
          try {
            const parsed = JSON.parse(message.payload.toString());
            const data = parsed.data || parsed;
            this.processNotifications(data);
          } catch (e) { console.error('Parse error', e); }
        },
        error: (error: any) => console.error('MQTT error:', error)
      });
    } catch (e) { console.error('MQTT connect error:', e); }
  }

  processNotifications(data: any): void {
    for (const tag of NOTIFICATION_TAGS) {
      const currentValue = data[tag.tagName];
      if (currentValue !== undefined) {
        const isActive = Boolean(currentValue);
        const wasActive = this.previousStates.get(tag.tagName) || false;

        // New notification triggered
        if (isActive && !wasActive) {
          this.addNotification(tag, true);
        }
        // Notification cleared
        else if (!isActive && wasActive) {
          this.clearNotification(tag.tagName);
        }

        this.previousStates.set(tag.tagName, isActive);
      }
    }

    this.applyFilters();
    this.cdr.detectChanges();
  }

  addNotification(tag: NotificationTag, isActive: boolean): void {
    // Check if already exists
    const existing = this.notifications.find(n => n.tagName === tag.tagName && n.isActive);
    if (existing) return;

    this.notificationId++;
    this.notifications.unshift({
      id: this.notificationId,
      tagName: tag.tagName,
      timestamp: new Date(),
      message: tag.message,
      type: tag.type,
      category: tag.category,
      isRead: false,
      isActive: isActive
    });

    // Play sound for critical/alarm
    if (tag.type === 'Critical' || tag.type === 'Alarm') {
      this.playAlertSound();
    }
  }

  clearNotification(tagName: string): void {
    const notification = this.notifications.find(n => n.tagName === tagName && n.isActive);
    if (notification) {
      notification.isActive = false;
    }
  }

  playAlertSound(): void {
    // Browser notification sound (optional)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==');
      audio.volume = 0.3;
      audio.play().catch(() => { });
    } catch (e) { }
  }

  applyFilters(): void {
    this.filteredNotifications = this.notifications.filter(n => {
      if (this.typeFilter !== 'all' && n.type !== this.typeFilter) return false;
      if (this.categoryFilter !== 'all' && n.category !== this.categoryFilter) return false;
      if (this.showActiveOnly && !n.isActive) return false;
      if (this.searchText.trim()) {
        const search = this.searchText.toLowerCase();
        return n.message.toLowerCase().includes(search) || n.tagName.toLowerCase().includes(search);
      }
      return true;
    });
  }

  filterByType(type: string): void { this.typeFilter = type; this.applyFilters(); }
  filterByCategory(category: string): void { this.categoryFilter = category; this.applyFilters(); }
  toggleActiveOnly(): void { this.showActiveOnly = !this.showActiveOnly; this.applyFilters(); }
  search(text: string): void { this.searchText = text; this.applyFilters(); }

  markAsRead(id: number): void {
    const n = this.notifications.find(n => n.id === id);
    if (n) { n.isRead = true; this.applyFilters(); }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
    this.applyFilters();
  }

  clearAllInactive(): void {
    this.notifications = this.notifications.filter(n => n.isActive);
    this.applyFilters();
  }

  getUnreadCount(): number { return this.notifications.filter(n => !n.isRead).length; }
  getActiveCount(): number { return this.notifications.filter(n => n.isActive).length; }
  getCriticalCount(): number { return this.notifications.filter(n => n.isActive && n.type === 'Critical').length; }

  getTypeClass(type: string): string {
    switch (type) {
      case 'Critical': return 'badge bg-danger';
      case 'Alarm': return 'badge bg-warning text-dark';
      case 'Warning': return 'badge bg-orange';
      case 'Fault': return 'badge bg-secondary';
      case 'Info': return 'badge bg-info text-dark';
      default: return 'badge bg-secondary';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'Critical': return 'bi bi-exclamation-octagon-fill';
      case 'Alarm': return 'bi bi-bell-fill';
      case 'Warning': return 'bi bi-exclamation-triangle-fill';
      case 'Fault': return 'bi bi-x-circle-fill';
      case 'Info': return 'bi bi-info-circle-fill';
      default: return 'bi bi-bell';
    }
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'Diesel Engine': return 'bi bi-fuel-pump';
      case 'Emergency': return 'bi bi-sign-stop';
      case 'Safety System': return 'bi bi-shield-exclamation';
      case 'Electrical': return 'bi bi-lightning-charge';
      case 'Status (Info)': return 'bi bi-info-circle';
      case 'Remote Control': return 'bi bi-broadcast';
      case 'Spreader': return 'bi bi-box-seam';
      case 'Outriggers': return 'bi bi-arrows-expand';
      case 'Cable Reel': return 'bi bi-disc';
      case 'System': return 'bi bi-gear';
      case 'Chassis': return 'bi bi-truck';
      case 'Hoist': return 'bi bi-arrow-up-circle';
      case 'Slewing': return 'bi bi-arrow-repeat';
      case 'Luffing': return 'bi bi-arrow-bar-up';
      case 'Travel': return 'bi bi-arrow-left-right';
      default: return 'bi bi-bell';
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
