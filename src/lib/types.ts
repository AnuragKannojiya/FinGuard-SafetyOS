// =============================================================================
// FinGuard SafetyOS — Central Type Definitions
// =============================================================================
// All shared types used across the safety intelligence platform.
// Simulation layer types, AI engine types, compliance types, and alert types.
// =============================================================================

// ---------------------------------------------------------------------------
// Enums & Literal Types
// ---------------------------------------------------------------------------

export type ShiftType = 'morning' | 'evening' | 'night';

export type AlertSeverity = 'info' | 'advisory' | 'warning' | 'critical' | 'emergency';

export type PermitType =
  | 'hot-work'
  | 'cold-work'
  | 'confined-space'
  | 'electrical-isolation'
  | 'height-work'
  | 'excavation';

export type SensorStatus = 'normal' | 'warning' | 'critical' | 'offline';

export type SensorTrend = 'rising' | 'falling' | 'stable';

export type ProcessUnitStatus =
  | 'running'
  | 'maintenance'
  | 'alarm'
  | 'shutdown'
  | 'startup';

export type PermitStatus =
  | 'draft'
  | 'approved'
  | 'active'
  | 'suspended'
  | 'closed';

export type ZoneType = 'process' | 'utility' | 'admin' | 'safety';

export type ComplianceStatus =
  | 'compliant'
  | 'non-compliant'
  | 'partial'
  | 'pending';

export type CheckType = 'automated' | 'manual' | 'documentation';

export type CheckFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annual';

export type RiskFactorType =
  | 'gas-level'
  | 'permit-conflict'
  | 'worker-density'
  | 'equipment-status'
  | 'shift-timing'
  | 'weather'
  | 'maintenance-gap'
  | 'ppe-violation';

export type CompoundRiskSeverity =
  | 'advisory'
  | 'warning'
  | 'critical'
  | 'emergency';

// ---------------------------------------------------------------------------
// Simulation Layer — Sensor Types
// ---------------------------------------------------------------------------

export interface SensorConfig {
  id: string;
  zoneId: string;
  type: string;
  unit: string;
  normalRange: { min: number; max: number };
  warningThreshold: number;
  criticalThreshold: number;
  position: { x: number; y: number };
}

export interface SensorReading {
  sensorId: string;
  value: number;
  unit: string;
  timestamp: number;
  status: SensorStatus;
  trend: SensorTrend;
}

// ---------------------------------------------------------------------------
// Simulation Layer — Zone Types
// ---------------------------------------------------------------------------

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  hazardLevel: number;
  maxOccupancy: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

// ---------------------------------------------------------------------------
// Simulation Layer — SCADA / Process Unit Types
// ---------------------------------------------------------------------------

export interface ProcessUnit {
  id: string;
  name: string;
  zoneId: string;
  status: ProcessUnitStatus;
  health: number;
}

// ---------------------------------------------------------------------------
// Simulation Layer — Permit Types
// ---------------------------------------------------------------------------

export interface Permit {
  id: string;
  type: string;
  title: string;
  zoneId: string;
  status: PermitStatus;
  riskLevel: string;
  workers: string[];
  validFrom: string;
  validTo: string;
  conflictsWith: string[];
}

// ---------------------------------------------------------------------------
// Simulation Layer — Worker Types
// ---------------------------------------------------------------------------

export interface Worker {
  id: string;
  name: string;
  role: string;
  shift: string;
  currentZone: string;
  ppeCompliance: boolean;
  status: string;
}

// ---------------------------------------------------------------------------
// Simulation Layer — Incident Types
// ---------------------------------------------------------------------------

export interface Incident {
  id: string;
  date: string;
  type: string;
  severity: number;
  zone: string;
  equipment: string;
  title: string;
  description: string;
  rootCause: string;
  contributingFactors: string[];
  injuries: number;
  fatalities: number;
}

// ---------------------------------------------------------------------------
// AI Engine — Compound Risk Types
// ---------------------------------------------------------------------------

export interface RiskFactor {
  type: RiskFactorType;
  source: string;
  value: number;
  threshold: number;
  weight: number;
  description: string;
}

export interface CompoundRisk {
  id: string;
  severity: CompoundRiskSeverity;
  title: string;
  description: string;
  contributingFactors: RiskFactor[];
  affectedZones: string[];
  affectedWorkers: number;
  compoundScore: number;
  individualScores: number[];
  predictionLeadTime: number;
  recommendedActions: string[];
  timestamp: Date;
  escalationHistory: EscalationEntry[];
}

export interface EscalationEntry {
  time: Date;
  from: string;
  to: string;
}

// ---------------------------------------------------------------------------
// AI Engine — Alert Types
// ---------------------------------------------------------------------------

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  zoneId: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  relatedRiskId?: string;
  relatedPermitId?: string;
  autoEscalate: boolean;
  escalationTimeoutMinutes: number;
}

// ---------------------------------------------------------------------------
// AI Engine — Emergency Event Types
// ---------------------------------------------------------------------------

export interface EmergencyEvent {
  id: string;
  type:
    | 'fire'
    | 'gas-leak'
    | 'explosion'
    | 'structural-failure'
    | 'chemical-spill'
    | 'medical'
    | 'natural-disaster';
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedZones: string[];
  evacuationRequired: boolean;
  evacuationZones: string[];
  musterPoints: string[];
  respondingTeams: string[];
  startTime: Date;
  estimatedContainment?: Date;
  status: 'active' | 'contained' | 'resolved' | 'investigating';
  casualties: { injuries: number; fatalities: number };
  environmentalImpact: string;
  regulatoryNotificationRequired: boolean;
}

// ---------------------------------------------------------------------------
// Compliance — Regulatory Requirement Types
// ---------------------------------------------------------------------------

export interface ComplianceRequirement {
  id: string;
  standard: string;
  clause: string;
  title: string;
  description: string;
  category: ComplianceCategory;
  checkType: CheckType;
  frequency: CheckFrequency;
  lastChecked: string;
  status: ComplianceStatus;
  score: number;
  deviations: string[];
}

export type ComplianceCategory =
  | 'Fire Safety'
  | 'Gas Detection'
  | 'PPE'
  | 'Permit-to-Work'
  | 'Emergency Preparedness'
  | 'Training'
  | 'Equipment Inspection'
  | 'Electrical Safety'
  | 'Structural Integrity'
  | 'Environmental';

export interface ComplianceAuditResult {
  overallScore: number;
  byStandard: Record<string, number>;
  byCategory: Record<string, number>;
  totalRequirements: number;
  compliant: number;
  nonCompliant: number;
  partial: number;
}

export interface CorrectiveAction {
  id: string;
  requirementId: string;
  deviation: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  assignedTo: string;
  status: 'open' | 'in-progress' | 'completed' | 'overdue';
}

export interface ScheduledInspection {
  id: string;
  requirementId: string;
  title: string;
  standard: string;
  date: string;
  inspector: string;
  zone: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
}

export interface ComplianceTrendPoint {
  month: string;
  score: number;
  compliant: number;
  nonCompliant: number;
  partial: number;
}

// ---------------------------------------------------------------------------
// Pattern Intelligence — Chart Data Types
// ---------------------------------------------------------------------------

export interface TemporalPattern {
  label: string;
  count: number;
  severity: number;
}

export interface RootCauseCluster {
  cause: string;
  count: number;
  severity: number;
  percentage: number;
}

export interface ShiftRiskProfile {
  shift: ShiftType;
  riskScore: number;
  incidentCount: number;
  averageSeverity: number;
}

export interface HighRiskPeriod {
  startDate: string;
  endDate: string;
  riskScore: number;
  reason: string;
  historicalIncidents: number;
}

export interface PreventionPriority {
  rank: number;
  action: string;
  category: string;
  estimatedLivesSaved: number;
  estimatedInjuriesPrevented: number;
  implementationCost: 'low' | 'medium' | 'high';
  timeToImplement: string;
}

export interface IncidentTrendPoint {
  month: string;
  total: number;
  critical: number;
  major: number;
  minor: number;
  nearMiss: number;
}
