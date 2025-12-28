import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { MqttService, IMqttMessage } from 'ngx-mqtt';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RouterLink } from '@angular/router';
import { HistoryService, HistoryDataPoint, TimeRange } from '../services/history.service';

@Component({
    selector: 'app-terex-supervision',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, RouterLink],
    templateUrl: './terex-supervision.component.html',
    styleUrl: './terex-supervision.component.css'
})
export class TerexSupervisionComponent implements OnInit, OnDestroy {
    private subscription: Subscription | null = null;
    hoistSpeed: number = 0;
    private _rotationValue: number = 90;
    private _jibExtension: number = 100;
    private _trolleyValue: number = 0;
    private _hookValue: number = 0;
    private _luffingValue: number = 0;
    private _isLoaded: boolean = true;

    // ============== ACCESSORY TYPE DETECTION ==============
    spreaderConnected: boolean = false;
    twinliftConnected: boolean = false;
    motorGrabActive: boolean = false;
    containerLocked: boolean = false;

    // Computed accessory type for display
    get currentAccessory(): string {
        if (this.twinliftConnected) return 'twinlift';
        if (this.spreaderConnected) return 'spreader';
        if (this.motorGrabActive) return 'grab';
        return 'hook';  // Default fallback
    }

    get accessoryImage(): string {
        switch (this.currentAccessory) {
            case 'twinlift': return 'spreader.png';
            case 'spreader': return 'spreader.png';
            case 'grab': return 'grabber.svg';
            default: return 'grabber.svg';
        }
    }

    // Returns CSS class for accessory-specific sizing
    get accessoryClass(): string {
        switch (this.currentAccessory) {
            case 'twinlift': return 'grabber-twinlift';
            case 'spreader': return 'grabber-spreader';
            case 'grab': return 'grabber-grab';
            default: return 'grabber-hook';
        }
    }

    unifiedRotationValue: number = 0;
    // Flag to prevent infinite update loops between rotation and unified rotation
    private _updatingFromRotation: boolean = false;

    // ============== SMOOTH ANIMATION SYSTEM ==============
    // Target values (from MQTT) - we smoothly interpolate towards these
    private targetRotation: number = 0;
    private targetLuffing: number = 0;
    private targetHook: number = 0;

    // Current display values (interpolated smoothly)
    displayRotation: number = 0;
    displayLuffing: number = 0;
    displayHook: number = 0;

    // Animation configuration
    private animationSpeed: number = 0.08;  // Interpolation factor (0.05-0.15 recommended)
    private animationFrameId: number | null = null;
    private isAnimating: boolean = false;
    private readonly EPSILON: number = 0.01;  // Threshold to stop animation

    // Luffing and hoisting properties
    armLuffingAngle: number = 40;
    flecheLuffingAngle: number = 10;
    flecheLuffingLeft: number = 100;
    flecheLuffingTop: number = 5;
    grabberTopPos: number = 5;
    ropeLeftPos: number = 332;
    grabberLeftPos: number = 175;
    ropeTopPos: number = 167;
    baseRopeHeight: number = 39;
    ropeGrabberTop: number = -20;

    // Hoisting grid properties
    minHeight: number = 0;
    maxHeight: number = 47; // 47 meters
    gridMarkers = Array.from({ length: 11 }, (_, i) => i * 5); // 0 to 50 meters (steps of 5)
    engineCode: string = '';

    // ============== HISTORY MODE ==============
    isHistoryMode = false;
    historyData: HistoryDataPoint[] = [];
    historyFrames: Map<string, HistoryDataPoint[]> = new Map();
    uniqueTimestamps: string[] = [];
    currentFrameIndex = 0;
    isPlaying = false;
    playbackSpeed = 1;
    selectedTimeRange = '24h';
    customStartDate: string = '';
    customEndDate: string = '';
    isLoadingHistory = false;
    historyError: string | null = null;
    currentPlaybackTime: Date | null = null;
    private playbackInterval: any = null;

    // Complete list of tag names for history queries
    private readonly HISTORY_TAG_NAMES = [
        'Angle_d_orientation_superstructure_chassis_valeur_reelle',
        'Portee_en_metres_codeur_absolu',
        'Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu',
        'Charge_nette_en_tonnes',
        'Vitesse_du_mec_levage_en_m_min',
        'VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt',
        'Ruckmeldung_1_Spreader_gesteckt',
        'Ruckmeldung_Container_verriegelt',
        'Motorgreiferbetrieb',
        'TK_Steuerhebel_Motorgreifer_Hubwerk2_Schlieen',
        'TK_Steuerhebel_Motorgreifer_Hubwerk2_Offnen'
    ];

    constructor(
        private route: ActivatedRoute,
        private _mqttService: MqttService,
        private cdr: ChangeDetectorRef,
        private historyService: HistoryService
    ) { }
    ngOnInit() {
        this.connectToTelemetry();
        this.startAnimationLoop();
        // Get the engineCode from route parameters
        this.route.paramMap.subscribe(params => {
            this.engineCode = params.get('engineCode') || '';
            console.log('Engine Code:', this.engineCode);
            // Here you would typically load engine-specific data
        });

        // Initialize the component
        this.updateLuffingComponents();
    }

    // ============== ANIMATION LOOP ==============
    private startAnimationLoop(): void {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animate();
    }

    private animate = (): void => {
        if (!this.isAnimating) return;

        // Smooth interpolation using easeOutExpo for natural deceleration
        this.displayRotation = this.smoothLerp(this.displayRotation, this.targetRotation);
        this.displayLuffing = this.smoothLerp(this.displayLuffing, this.targetLuffing);
        this.displayHook = this.smoothLerp(this.displayHook, this.targetHook);

        // Update internal values from display values
        this._rotationValue = this.displayRotation;
        this._luffingValue = this.displayLuffing;
        this._hookValue = this.displayHook;

        // Update computed positions
        this.updateLuffingComponents();

        // Trigger change detection
        this.cdr.detectChanges();

        // Continue animation loop
        this.animationFrameId = requestAnimationFrame(this.animate);
    }

    private smoothLerp(current: number, target: number): number {
        // Ease-out interpolation: fast start, slow finish (more natural feel)
        const diff = target - current;
        if (Math.abs(diff) < this.EPSILON) return target;

        // EaseOutQuad: provides smooth deceleration
        return current + diff * this.animationSpeed;
    }

    private stopAnimationLoop(): void {
        this.isAnimating = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }


    // Getters and setters for crane properties
    get rotationValue(): number {
        // Calculate rotation based on unified rotation value
        return Math.round(this.lerp(this.initialRotation, this.finalRotation, this.unifiedRotationValue / 100)) % 360;
    }

    set rotationValue(value: number) {
        // Ensure value is within 0-360 range
        value = (value + 360) % 360;
        this._rotationValue = value;

        // Calculate progress between initial and final rotation
        const progress = this.calculateProgress(this.initialRotation, this.finalRotation, value);

        // Update unified rotation value
        this.unifiedRotation = progress * 100;
    }

    possibleAngles: number[] = this.generateAngles(-360, 360, 5);

    // Initial and final angles for rotation
    initialRotation = 0;
    finalRotation = 180;

    // Getter for the current angle based on unified rotation value
    get currentAngle(): number {
        // Calculate angle based on unified rotation value
        return Math.round(this.lerp(this.initialRotation, this.finalRotation, this.unifiedRotationValue / 100));
    }
    set unifiedRotation(value: number) {
        this.unifiedRotationValue = value;
        // The getters handle calculations for rotation and scaleX
    }

    get unifiedRotation(): number {
        return this.unifiedRotationValue;
    }


    // Helper function to generate the angle array
    private generateAngles(min: number, max: number, step: number): number[] {
        const angles = [];
        for (let angle = min; angle <= max; angle += step) {
            angles.push(angle);
        }
        return angles;
    }
    possibleScaleX: number[] = this.generateScaleX(-1, 1, 0.1);

    // Initial and final scaleX values
    initialScaleX = 1;
    finalScaleX = -1;

    // Private property for scaleX index
    private _currentScaleXIndex: number = this.possibleScaleX.findIndex(scale => scale === this.initialScaleX);

    // Getter for the current scaleX based on unified rotation value
    get currentScaleX(): number {
        // Calculate scaleX based on unified rotation value
        return Number(this.lerp(this.initialScaleX, this.finalScaleX, this.unifiedRotationValue / 100).toFixed(1));
    }

    // Getter for scaleX index
    get currentScaleXIndex(): number {
        return this._currentScaleXIndex;
    }

    // Setter for the scaleX index - updates the unified rotation value
    set currentScaleXIndex(index: number) {
        this._currentScaleXIndex = index;
        const scale = this.possibleScaleX[index];
        // Calculate progress between initial and final scaleX
        const progress = this.calculateProgress(this.initialScaleX, this.finalScaleX, scale);
        this.unifiedRotation = progress * 100;
    }

    // Helper function to generate the scaleX array
    private generateScaleX(min: number, max: number, step: number): number[] {
        const scaleX: number[] = [];
        for (let x = min; x <= max; x += step) {
            // Fix potential floating point inaccuracies
            scaleX.push(Math.round(x * 10) / 10);

        }

        return scaleX;
    }

    get jibExtension(): number {
        return this._jibExtension;
    }

    set jibExtension(value: number) {
        this._jibExtension = this.clampValue(value, 20, 100);
    }

    get trolleyValue(): number {
        return this._trolleyValue;
    }

    set trolleyValue(value: number) {
        // Trolley position depends on jib extension
        const maxTrolley = this._jibExtension;
        this._trolleyValue = this.clampValue(value, 0, maxTrolley);
    }

    get hookValue(): number {
        return this._hookValue;
    }

    set hookValue(value: number) {
        this._hookValue = this.clampValue(value, 0, 100);
        this.updateHoistingComponents();
    }

    get luffingValue(): number {
        return this._luffingValue;
    }

    set luffingValue(value: number) {
        this._luffingValue = this.clampValue(value, 0, 100);
        this.updateLuffingComponents();
    }

    get isLoaded(): boolean {
        return this._isLoaded;
    }

    // Computed properties for display
    get luffingAngle(): number {
        return this.lerp(40, 0, this._luffingValue / 100);
    }

    get ropeHeight(): number {
        // Height based on hoisting value (0 = minimum height, 100 = maximum height)
        return this.baseRopeHeight + (this._hookValue / 100) * 200;
    }

    // Current height in meters based on hook value
    get currentHeight(): number {
        return this.lerp(this.minHeight, this.maxHeight, this._hookValue / 100);
    }

    // Style for the rope in the hoisting mechanism
    get ropeStyle() {
        const height = this.lerp(50, 400, this._hookValue / 100);
        return {
            height: `${height}px`
        };
    }

    // Style for the grabber in the hoisting mechanism
    get grabberStyle() {
        const top = this.lerp(50, 400, this._hookValue / 100);
        return {
            top: `${top}px`
        };
    }

    // Image for the grabber based on accessory type and load state
    get grabberImage(): string {
        // Use accessoryImage for dynamic detection
        return this.accessoryImage;
    }

    get grabberTop(): number {
        // Base position + offset from luffing + offset from hoisting
        const luffingOffset = this.grabberTopPos;
        const hoistingOffset = (this._hookValue / 100) * 200;
        return 130 + luffingOffset + hoistingOffset;
    }

    // Style objects for crane components
    get flecheStyle(): { [key: string]: string } {
        const rotate = this.flecheLuffingAngle;
        const left = this.flecheLuffingLeft;
        const top = this.flecheLuffingTop;

        return {
            'transform': `rotate(${rotate}deg)`,
            'left': `${left}px`,
            'top': `${top}px`
        };
    }

    get armStyle(): { [key: string]: string } {
        const rotate = this.armLuffingAngle;
        return {
            'transform': `rotate(${rotate}deg)`
        };
    }

    // Methods for crane control
    rotateLeft(): void {
        const newValue = this.rotationValue - 5;
        this.rotationValue = (newValue + 360) % 360;
        this.updateLuffingComponents();
    }

    rotateRight(): void {
        const newValue = this.rotationValue + 5;
        this.rotationValue = newValue % 360;
        this.updateLuffingComponents();
    }

    // Handle rotation update from range input
    updateRotationFromRange(event: any): void {
        // The unifiedRotationValue is already updated via two-way binding
        // Just need to update the components
        this.updateLuffingComponents();
    }

    // Helper function to calculate progress between start and end values
    private calculateProgress(start: number, end: number, current: number): number {
        // Handle the case where the rotation crosses the 0/360 boundary
        if (start > end) {
            // For example, going from 280 to 100 degrees
            if (current >= start || current <= end) {
                // We're in the valid range
                if (current >= start) {
                    // Between start and 360
                    return (current - start) / ((360 - start) + end);
                } else {
                    // Between 0 and end
                    return ((360 - start) + current) / ((360 - start) + end);
                }
            } else {
                // Outside the range, clamp to 0 or 1
                if (this.getShortestRotationDistance(current, start) <
                    this.getShortestRotationDistance(current, end)) {
                    return 0; // Closer to start
                } else {
                    return 1; // Closer to end
                }
            }
        } else {
            // Normal case (e.g., 100 to 280)
            return Math.max(0, Math.min(1, (current - start) / (end - start)));
        }
    }

    extendJib(): void {
        this.jibExtension += 5;
        // If trolley is beyond new jib extension, adjust it
        if (this.trolleyValue > this.jibExtension) {
            this.trolleyValue = this.jibExtension;
        }
    }

    retractJib(): void {
        this.jibExtension -= 5;
        // If trolley is beyond new jib extension, adjust it
        if (this.trolleyValue > this.jibExtension) {
            this.trolleyValue = this.jibExtension;
        }
    }

    moveTrolleyIn(): void {
        this.trolleyValue -= 5;
    }

    moveTrolleyOut(): void {
        this.trolleyValue += 5;
    }

    raiseHook(): void {
        this.hookValue -= 5;
    }

    lowerHook(): void {
        this.hookValue += 5;
    }

    luffUp(): void {
        this.luffingValue -= 5;
    }

    luffDown(): void {
        this.luffingValue += 5;
    }

    toggleLoad(): void {
        this._isLoaded = !this._isLoaded;
        console.log('Load status toggled:', this._isLoaded ? 'ATTACHED' : 'DETACHED');
    }

    // Update methods for component synchronization
    updateLuffingComponents(): void {
        const progress = this._luffingValue / 100; // 0 to 1 transition value

        // Linear interpolation between initial and final states
        this.armLuffingAngle = this.lerp(-20, 20, progress);
        this.flecheLuffingAngle = this.lerp(10, 5, progress);
        this.flecheLuffingLeft = this.lerp(215, 130, progress);
        this.grabberLeftPos = this.lerp(45, 133, progress);
        this.grabberTopPos = this.lerp(-150, -67, progress);
        this.ropeLeftPos = this.lerp(302, 392, progress);
        this.ropeGrabberTop = this.lerp(-9, 20, progress);
        this.ropeTopPos = this.lerp(-54, 30, progress);
        this.flecheLuffingTop = this.lerp(50, 0, progress);
    }

    updateHoistingComponents(): void {
        // Calculations are handled in the getters for ropeHeight and grabberTop
        // This method exists for potential future enhancements
    }

    // Helper methods
    private clampValue(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    // Helper method to get the shortest rotation distance between two angles
    private getShortestRotationDistance(from: number, to: number): number {
        const diff = (to - from + 360) % 360;
        return diff > 180 ? 360 - diff : diff;
    }

    // Linear interpolation helper for positioning elements
    lerp(start: number, end: number, t: number): number {
        return start * (1 - t) + end * t;
    }

    // Get text representation of positions for display
    getRotationText(): string {
        return `${this.rotationValue.toFixed(1)}°`;
    }

    getJibExtensionText(): string {
        return `${this.jibExtension.toFixed(1)}%`;
    }

    getTrolleyPositionText(): string {
        return `${this.trolleyValue.toFixed(1)}%`;
    }

    getHookHeightText(): string {
        return `${this.hookValue.toFixed(1)}%`;
    }

    getLuffingAngleText(): string {
        return `${this.luffingAngle.toFixed(1)}°`;
    }

    getLoadStateText(): string {
        return this.isLoaded ? 'ATTACHED' : 'DETACHED';
    }
    ngOnDestroy(): void {
        this.stopAnimationLoop();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    connectToTelemetry(): void {
        console.log('Attempting to connect to MQTT...');
        try {
            this.subscription = this._mqttService.observe('site/pi5/generator/snapshot').subscribe({
                next: (message: IMqttMessage) => {
                    const payload = message.payload.toString();
                    console.log('MQTT Message Received:', payload);
                    try {
                        const parsed = JSON.parse(payload);
                        console.log('Parsed Data:', parsed);
                        // Check if data is wrapped in a 'data' property (common in some MQTT payloads)
                        const telemetryData = parsed.data || parsed;
                        this.updateCraneFromTelemetry(telemetryData);
                    } catch (e) {
                        console.error('Failed to parse MQTT message', e);
                    }
                },
                error: (error: any) => {
                    console.error('MQTT connection error:', error);
                }
            });
            console.log('Subscribed to topic: site/pi5/generator/snapshot');
        } catch (e) {
            console.error('Failed to connect to MQTT:', e);
        }
    }

    updateCraneFromTelemetry(data: any): void {
        // Rotation (Slewing) - Set TARGET for smooth animation
        if (data.Angle_d_orientation_superstructure_chassis_valeur_reelle !== undefined) {
            const newRotation = -Number(data.Angle_d_orientation_superstructure_chassis_valeur_reelle);
            this.targetRotation = newRotation;
            // Also update the unified rotation for slider sync
            this.rotationValue = newRotation;
        }

        // Luffing (Boom Radius) - Set TARGET for smooth animation
        if (data.Portee_en_metres_codeur_absolu !== undefined) {
            const radius = Number(data.Portee_en_metres_codeur_absolu);
            // GHMK 6605 specs: 11m to 51m working radius
            const clampedRadius = Math.max(11, Math.min(51, radius));
            this.targetLuffing = ((clampedRadius - 11) / (51 - 11)) * 100;
        }

        // Hoisting (Hook Height) - Set TARGET for smooth animation
        if (data.Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu !== undefined) {
            const height = Number(data.Valeur_reelle_de_la_hauteur_de_levage_en_m_codeur_absolu);
            // GHMK 6605 specs: 0 to 47m hook height
            const clampedHeight = Math.max(0, Math.min(47, height));
            // Invert: 0m = 100% rope out, 47m = 0% rope out
            this.targetHook = ((47 - clampedHeight) / 47) * 100;
        }

        // Load Status (immediate, no animation needed)
        if (data.Charge_nette_en_tonnes !== undefined) {
            this._isLoaded = Number(data.Charge_nette_en_tonnes) > 0.5;
        }

        // Hoist Speed (for display)
        if (data.Vitesse_du_mec_levage_en_m_min !== undefined) {
            this.hoistSpeed = Number(data.Vitesse_du_mec_levage_en_m_min) / 60;
        }

        // ============== ACCESSORY TYPE DETECTION ==============
        // Twinlift Spreader (highest priority)
        if (data.VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt !== undefined) {
            this.twinliftConnected = Boolean(data.VAR_Ruckmeldung_2_Twinlift_Spreader_gesteckt);
        }

        // Standard Spreader
        if (data.Ruckmeldung_1_Spreader_gesteckt !== undefined) {
            this.spreaderConnected = Boolean(data.Ruckmeldung_1_Spreader_gesteckt);
        }

        // Motor Grab (detected by control lever activity)
        if (data.TK_Steuerhebel_Motorgreifer_Hubwerk2_Schlieen !== undefined ||
            data.TK_Steuerhebel_Motorgreifer_Hubwerk2_Offnen !== undefined) {
            this.motorGrabActive = Boolean(data.TK_Steuerhebel_Motorgreifer_Hubwerk2_Schlieen) ||
                Boolean(data.TK_Steuerhebel_Motorgreifer_Hubwerk2_Offnen);
        }

        // Also check for Motorgreiferbetrieb (motor grab mode) 
        if (data.Motorgreiferbetrieb !== undefined) {
            this.motorGrabActive = Boolean(data.Motorgreiferbetrieb);
        }

        // Container lock status
        if (data.Ruckmeldung_Container_verriegelt !== undefined) {
            this.containerLocked = Boolean(data.Ruckmeldung_Container_verriegelt);
        }

        // Animation loop handles cdr.detectChanges()
    }

    // ============== HISTORY MODE METHODS ==============
    toggleHistoryMode(): void {
        this.isHistoryMode = !this.isHistoryMode;
        if (this.isHistoryMode) {
            this.stopPlayback();
            if (this.subscription) {
                this.subscription.unsubscribe();
                this.subscription = null;
            }
            this.fetchHistoryData();
        } else {
            this.stopPlayback();
            this.historyData = [];
            this.historyFrames.clear();
            this.uniqueTimestamps = [];
            this.connectToTelemetry();
        }
    }

    getTimeRange(): TimeRange {
        const now = new Date();
        let start: Date;
        let end = now;

        switch (this.selectedTimeRange) {
            case '1h':
                start = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'custom':
                start = this.customStartDate ? new Date(this.customStartDate) : new Date(now.getTime() - 24 * 60 * 60 * 1000);
                end = this.customEndDate ? new Date(this.customEndDate) : now;
                break;
            default:
                start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        return { startTime: start, endTime: end };
    }

    fetchHistoryData(): void {
        this.isLoadingHistory = true;
        this.historyError = null;
        const range = this.getTimeRange();

        this.historyService.getTagHistory(
            this.HISTORY_TAG_NAMES,
            range.startTime,
            range.endTime,
            10000,
            false
        ).subscribe({
            next: (response) => {
                this.historyData = response.data;
                this.processHistoryData();
                this.isLoadingHistory = false;
                console.log(`Loaded ${response.count} history records for terex-supervision`);
            },
            error: (error) => {
                console.error('Error fetching history:', error);
                this.historyError = 'Failed to load history data';
                this.isLoadingHistory = false;
            }
        });
    }

    processHistoryData(): void {
        this.historyFrames.clear();
        const timestamps = new Set<string>();

        for (const point of this.historyData) {
            timestamps.add(point.ts);
            if (!this.historyFrames.has(point.ts)) {
                this.historyFrames.set(point.ts, []);
            }
            this.historyFrames.get(point.ts)!.push(point);
        }

        this.uniqueTimestamps = Array.from(timestamps).sort();
        this.currentFrameIndex = 0;

        if (this.uniqueTimestamps.length > 0) {
            this.applyHistoryFrame(0);
        }
    }

    applyHistoryFrame(index: number): void {
        if (index < 0 || index >= this.uniqueTimestamps.length) return;

        const ts = this.uniqueTimestamps[index];
        const frameData = this.historyFrames.get(ts) || [];
        this.currentPlaybackTime = new Date(ts);

        // Build data object from frame points
        const data: any = {};
        for (const point of frameData) {
            data[point.name] = point.value;
        }

        // Apply to crane visualization
        this.updateCraneFromTelemetry(data);
        this.currentFrameIndex = index;
    }

    // Playback controls
    togglePlayback(): void {
        if (this.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback(): void {
        if (this.uniqueTimestamps.length === 0) return;
        this.isPlaying = true;
        const intervalMs = 1000 / this.playbackSpeed;

        this.playbackInterval = setInterval(() => {
            if (this.currentFrameIndex < this.uniqueTimestamps.length - 1) {
                this.currentFrameIndex++;
                this.applyHistoryFrame(this.currentFrameIndex);
            } else {
                this.stopPlayback();
            }
        }, intervalMs);
    }

    stopPlayback(): void {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }

    seekToFrame(index: number): void {
        this.applyHistoryFrame(index);
    }

    skipBackward(): void {
        const newIndex = Math.max(0, this.currentFrameIndex - 10);
        this.applyHistoryFrame(newIndex);
    }

    skipForward(): void {
        const newIndex = Math.min(this.uniqueTimestamps.length - 1, this.currentFrameIndex + 10);
        this.applyHistoryFrame(newIndex);
    }

    setPlaybackSpeed(speed: number): void {
        this.playbackSpeed = speed;
        if (this.isPlaying) {
            this.stopPlayback();
            this.startPlayback();
        }
    }

    onTimeRangeChange(): void {
        if (this.isHistoryMode) {
            this.fetchHistoryData();
        }
    }

    getPlaybackProgress(): number {
        if (this.uniqueTimestamps.length === 0) return 0;
        return (this.currentFrameIndex / (this.uniqueTimestamps.length - 1)) * 100;
    }

    formatPlaybackTime(): string {
        if (!this.currentPlaybackTime) return '--:--:--';
        return this.currentPlaybackTime.toLocaleTimeString();
    }
}
