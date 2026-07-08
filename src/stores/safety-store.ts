import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────────────────

export type AlertSeverity = 'info' | 'advisory' | 'warning' | 'critical' | 'emergency';
export type ShiftType = 'morning' | 'evening' | 'night';
export type PlantStatus = 'normal' | 'elevated' | 'warning' | 'critical';
export type PermitStatus = 'draft' | 'approved' | 'active' | 'suspended' | 'closed';

export interface SensorReading {
  sensorId: string;
  value: number;
  unit: string;
  timestamp: number;
  status: 'normal' | 'warning' | 'critical' | 'offline';
  trend: 'rising' | 'falling' | 'stable';
  zoneId: string;
  type: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  zone: string;
  source: string;
  timestamp: number;
  acknowledged: boolean;
  compoundRiskId?: string;
}

export interface CompoundRisk {
  id: string;
  severity: 'advisory' | 'warning' | 'critical' | 'emergency';
  title: string;
  description: string;
  contributingFactors: {
    type: string;
    source: string;
    value: number;
    threshold: number;
    weight: number;
    description: string;
  }[];
  affectedZones: string[];
  affectedWorkers: number;
  compoundScore: number;
  individualScores: number[];
  predictionLeadTime: number;
  recommendedActions: string[];
  timestamp: Date;
  escalationHistory: { time: Date; from: string; to: string }[];
}

export interface ProcessUnit {
  id: string;
  name: string;
  zoneId: string;
  status: 'running' | 'maintenance' | 'alarm' | 'shutdown' | 'startup';
  health: number;
  lastMaintenance: string;
  nextMaintenance: string;
  parameters: Record<string, number>;
}

export interface Permit {
  id: string;
  type: string;
  title: string;
  description: string;
  zoneId: string;
  requestedBy: string;
  approvedBy: string;
  status: PermitStatus;
  validFrom: string;
  validTo: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  workers: string[];
  conditions: string[];
  conflictsWith: string[];
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  shift: ShiftType;
  currentZone: string;
  previousZone: string;
  ppeCompliance: boolean;
  status: 'active' | 'break' | 'transit' | 'emergency';
  entryTime: string;
  certifications: string[];
}

export interface Zone {
  id: string;
  name: string;
  type: 'process' | 'utility' | 'admin' | 'safety';
  position: { x: number; y: number };
  size: { width: number; height: number };
  hazardLevel: number;
  maxOccupancy: number;
  riskScore: number;
  description: string;
}

export interface EmergencyEvent {
  id: string;
  type: 'fire' | 'gas-leak' | 'explosion' | 'structural' | 'chemical-spill' | 'medical';
  severity: AlertSeverity;
  status: 'detected' | 'confirmed' | 'responding' | 'contained' | 'resolved';
  zone: string;
  triggeredAt: Date;
  confirmedAt?: Date;
  resolvedAt?: Date;
  evacuationZones: string[];
  responseTeams: string[];
  casualties: { injuries: number; fatalities: number };
  actions: { time: Date; action: string; status: 'pending' | 'in-progress' | 'completed' }[];
}

// ── Store ──────────────────────────────────────────────────────────

interface SafetyStoreState {
  // Core data
  sensorReadings: Record<string, SensorReading>;
  alerts: Alert[];
  compoundRisks: CompoundRisk[];
  processUnits: ProcessUnit[];
  permits: Permit[];
  workers: Worker[];
  zones: Zone[];
  
  // Plant status
  plantStatus: PlantStatus;
  isSimulating: boolean;
  simulationSpeed: number;
  currentShift: ShiftType;
  
  // Emergency
  activeEmergency: EmergencyEvent | null;
  emergencyHistory: EmergencyEvent[];
  
  // Stats
  stats: {
    totalSensors: number;
    activeSensors: number;
    criticalReadings: number;
    warningReadings: number;
    activePermits: number;
    workersOnSite: number;
    complianceScore: number;
    incidentsToday: number;
  };
  
  // Actions
  updateSensorReading: (reading: SensorReading) => void;
  updateSensorReadings: (readings: SensorReading[]) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  setCompoundRisks: (risks: CompoundRisk[]) => void;
  setProcessUnits: (units: ProcessUnit[]) => void;
  setPermits: (permits: Permit[]) => void;
  setWorkers: (workers: Worker[]) => void;
  setZones: (zones: Zone[]) => void;
  setPlantStatus: (status: PlantStatus) => void;
  setIsSimulating: (simulating: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  updateStats: (stats: Partial<SafetyStoreState['stats']>) => void;
  triggerEmergency: (event: EmergencyEvent) => void;
  resolveEmergency: () => void;
  setCurrentShift: (shift: ShiftType) => void;
}

export const useSafetyStore = create<SafetyStoreState>((set, get) => ({
  // Initial state
  sensorReadings: {},
  alerts: [],
  compoundRisks: [],
  processUnits: [],
  permits: [],
  workers: [],
  zones: [],
  
  plantStatus: 'normal',
  isSimulating: true,
  simulationSpeed: 1,
  currentShift: 'morning',
  
  activeEmergency: null,
  emergencyHistory: [],
  
  stats: {
    totalSensors: 0,
    activeSensors: 0,
    criticalReadings: 0,
    warningReadings: 0,
    activePermits: 0,
    workersOnSite: 0,
    complianceScore: 87,
    incidentsToday: 0,
  },
  
  // Actions
  updateSensorReading: (reading) =>
    set((state) => ({
      sensorReadings: { ...state.sensorReadings, [reading.sensorId]: reading },
    })),
  
  updateSensorReadings: (readings) =>
    set((state) => {
      const newReadings = { ...state.sensorReadings };
      for (const r of readings) {
        newReadings[r.sensorId] = r;
      }
      // Calculate plant status from readings
      const values = Object.values(newReadings);
      const criticalCount = values.filter(r => r.status === 'critical').length;
      const warningCount = values.filter(r => r.status === 'warning').length;
      
      let plantStatus: PlantStatus = 'normal';
      if (criticalCount >= 3) plantStatus = 'critical';
      else if (criticalCount >= 1 || warningCount >= 5) plantStatus = 'warning';
      else if (warningCount >= 2) plantStatus = 'elevated';
      
      return {
        sensorReadings: newReadings,
        plantStatus,
        stats: {
          ...state.stats,
          totalSensors: values.length,
          activeSensors: values.filter(r => r.status !== 'offline').length,
          criticalReadings: criticalCount,
          warningReadings: warningCount,
        },
      };
    }),
  
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 50), // Keep max 50 alerts
    })),
  
  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a),
    })),
  
  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter(a => a.id !== id),
    })),
  
  setCompoundRisks: (risks) => set({ compoundRisks: risks }),
  setProcessUnits: (units) => set({ processUnits: units }),
  
  setPermits: (permits) =>
    set((state) => ({
      permits,
      stats: {
        ...state.stats,
        activePermits: permits.filter(p => p.status === 'active').length,
      },
    })),
  
  setWorkers: (workers) =>
    set((state) => ({
      workers,
      stats: {
        ...state.stats,
        workersOnSite: workers.filter(w => w.status === 'active' || w.status === 'break').length,
      },
    })),
  
  setZones: (zones) => set({ zones }),
  setPlantStatus: (status) => set({ plantStatus: status }),
  setIsSimulating: (simulating) => set({ isSimulating: simulating }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
  
  updateStats: (stats) =>
    set((state) => ({
      stats: { ...state.stats, ...stats },
    })),
  
  triggerEmergency: (event) =>
    set({ activeEmergency: event }),
  
  resolveEmergency: () =>
    set((state) => ({
      activeEmergency: null,
      emergencyHistory: state.activeEmergency
        ? [...state.emergencyHistory, { ...state.activeEmergency, status: 'resolved' as const, resolvedAt: new Date() }]
        : state.emergencyHistory,
    })),
  
  setCurrentShift: (shift) => set({ currentShift: shift }),
}));
