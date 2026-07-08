// =============================================================================
// FinGuard SafetyOS — Compound Risk Engine
// =============================================================================
// Multi-factor risk correlation engine that detects compound hazards by
// analyzing the intersection of sensor data, permits, worker positions,
// SCADA status, shift patterns, and zone configurations.
//
// 10 compound risk rules implement weighted geometric mean scoring with
// severity classification and trend-based prediction lead-time estimation.
// =============================================================================

import type {
  SensorReading,
  Permit,
  Worker,
  ProcessUnit,
  Zone,
  ShiftType,
  CompoundRisk,
  CompoundRiskSeverity,
  RiskFactor,
  RiskFactorType,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Adjacency Map — which zones are physically adjacent
// ---------------------------------------------------------------------------

const ZONE_ADJACENCY: Record<string, string[]> = {
  'zone-1': ['zone-2', 'zone-3'],
  'zone-2': ['zone-1', 'zone-4'],
  'zone-3': ['zone-1', 'zone-5'],
  'zone-4': ['zone-2', 'zone-5', 'zone-6'],
  'zone-5': ['zone-3', 'zone-4'],
  'zone-6': ['zone-4'],
  'zone-7': ['zone-8'],
  'zone-8': ['zone-7'],
};

function areAdjacent(zoneA: string, zoneB: string): boolean {
  if (zoneA === zoneB) return true;
  return ZONE_ADJACENCY[zoneA]?.includes(zoneB) ?? false;
}

// ---------------------------------------------------------------------------
// Gas sensor type identifiers
// ---------------------------------------------------------------------------

const GAS_SENSOR_TYPES = ['CH4', 'H2S', 'CO', 'SO2', 'NH3', 'VOC', 'LEL'];
const HUMIDITY_SENSOR_TYPES = ['humidity', 'RH'];

function isGasSensor(sensorId: string, type?: string): boolean {
  if (type && GAS_SENSOR_TYPES.some((g) => type.toUpperCase().includes(g))) return true;
  return GAS_SENSOR_TYPES.some((g) => sensorId.toUpperCase().includes(g));
}

function isHumiditySensor(sensorId: string, type?: string): boolean {
  if (type && HUMIDITY_SENSOR_TYPES.some((h) => type.toLowerCase().includes(h.toLowerCase())))
    return true;
  return sensorId.toLowerCase().includes('humid') || sensorId.toLowerCase().includes('rh');
}

// ---------------------------------------------------------------------------
// Sensor → Zone mapping heuristic
// ---------------------------------------------------------------------------

function sensorZone(sensorId: string): string {
  const match = sensorId.match(/zone-(\d+)/i);
  if (match) return `zone-${match[1]}`;
  const numMatch = sensorId.match(/(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    return `zone-${((n - 1) % 8) + 1}`;
  }
  return 'zone-1';
}

// ---------------------------------------------------------------------------
// Scoring Helpers
// ---------------------------------------------------------------------------

/**
 * Weighted geometric mean of individual risk scores.
 * Each score is clamped to [0, 100]. Zero-weight factors are ignored.
 */
function weightedGeometricMean(factors: RiskFactor[]): number {
  const active = factors.filter((f) => f.weight > 0);
  if (active.length === 0) return 0;

  const totalWeight = active.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return 0;

  let logSum = 0;
  for (const f of active) {
    const score = clamp(factorScore(f), 1, 100); // min 1 to avoid log(0)
    logSum += (f.weight / totalWeight) * Math.log(score);
  }

  return clamp(Math.exp(logSum), 0, 100);
}

function factorScore(f: RiskFactor): number {
  if (f.threshold === 0) return f.value > 0 ? 80 : 0;
  const ratio = f.value / f.threshold;
  return clamp(ratio * 60, 0, 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function severityFromScore(score: number): CompoundRiskSeverity {
  if (score >= 75) return 'emergency';
  if (score >= 50) return 'critical';
  if (score >= 25) return 'warning';
  return 'advisory';
}

// ---------------------------------------------------------------------------
// Prediction Lead-Time
// ---------------------------------------------------------------------------

/**
 * Estimate minutes until a rising sensor breaches its critical threshold.
 * Uses a simple linear extrapolation based on the current value vs threshold.
 */
function estimateLeadTime(readings: SensorReading[], thresholdMultiplier = 1): number {
  const risingReadings = readings.filter((r) => r.trend === 'rising');
  if (risingReadings.length === 0) return 60; // default 60 min if no rising trend

  // Heuristic: how far from threshold × base rate
  const avgRatio =
    risingReadings.reduce((sum, r) => {
      const headroom = Math.max(0, 1 - r.value / (r.value * 1.5 * thresholdMultiplier));
      return sum + headroom;
    }, 0) / risingReadings.length;

  // Map headroom ratio → minutes (0 headroom = 5 min, 1 headroom = 120 min)
  return Math.round(5 + avgRatio * 115);
}

// ---------------------------------------------------------------------------
// Helper: count workers in a zone
// ---------------------------------------------------------------------------

function workersInZone(workers: Worker[], zoneId: string): number {
  return workers.filter((w) => w.currentZone === zoneId).length;
}

function workersInZones(workers: Worker[], zoneIds: string[]): number {
  return workers.filter((w) => zoneIds.includes(w.currentZone)).length;
}

// ---------------------------------------------------------------------------
// Helper: current shift detection
// ---------------------------------------------------------------------------

function isNightShift(shift: ShiftType): boolean {
  return shift === 'night';
}

function isShiftChangeover(currentTime?: Date): boolean {
  const now = currentTime ?? new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const totalMinutes = hour * 60 + minute;

  // Shift changeover windows: 06:00 ±30, 14:00 ±30, 22:00 ±30
  const changeovers = [360, 840, 1320];
  return changeovers.some((c) => Math.abs(totalMinutes - c) <= 30);
}

// ---------------------------------------------------------------------------
// Unique ID Generator
// ---------------------------------------------------------------------------

let riskCounter = 0;
function nextRiskId(): string {
  riskCounter += 1;
  return `CR-${Date.now().toString(36)}-${riskCounter.toString().padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// RULE 1: Gas + Hot Work
// ---------------------------------------------------------------------------

function rule_GasPlusHotWork(
  readings: SensorReading[],
  permits: Permit[],
  workers: Worker[],
  zones: Zone[],
): CompoundRisk[] {
  const risks: CompoundRisk[] = [];
  const hotWorkPermits = permits.filter(
    (p) => p.type === 'hot-work' && (p.status === 'active' || p.status === 'approved'),
  );

  for (const permit of hotWorkPermits) {
    const relevantZones = [permit.zoneId, ...(ZONE_ADJACENCY[permit.zoneId] ?? [])];
    const gasReadings = readings.filter(
      (r) => isGasSensor(r.sensorId) && relevantZones.includes(sensorZone(r.sensorId)),
    );
    const elevatedGas = gasReadings.filter(
      (r) => r.status === 'warning' || r.status === 'critical',
    );

    if (elevatedGas.length > 0) {
      const factors: RiskFactor[] = [
        {
          type: 'gas-level',
          source: elevatedGas.map((g) => g.sensorId).join(', '),
          value: Math.max(...elevatedGas.map((g) => g.value)),
          threshold: 50,
          weight: 0.6,
          description: `Elevated gas detected: ${elevatedGas.map((g) => `${g.sensorId}=${g.value}${g.unit}`).join(', ')}`,
        },
        {
          type: 'permit-conflict',
          source: permit.id,
          value: 80,
          threshold: 100,
          weight: 0.4,
          description: `Active hot work permit "${permit.title}" in zone ${permit.zoneId}`,
        },
      ];

      const score = weightedGeometricMean(factors);
      const affectedZones = [...new Set(relevantZones)];

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'Gas Elevation Near Hot Work Activity',
        description: `Elevated combustible gas readings detected in zones adjacent to active hot work permit "${permit.title}". Immediate gas monitoring escalation required. Risk of ignition if concentrations reach LEL.`,
        contributingFactors: factors,
        affectedZones,
        affectedWorkers: workersInZones(workers, affectedZones),
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: estimateLeadTime(elevatedGas),
        recommendedActions: [
          'Immediately suspend hot work permit and evacuate work area',
          'Deploy portable gas monitors to adjacent zones',
          'Notify fire watch and standby emergency team',
          'Verify ventilation systems are operating at maximum capacity',
          'Do not resume hot work until gas levels return to normal for 30+ minutes',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// RULE 2: Confined Space + Gas
// ---------------------------------------------------------------------------

function rule_ConfinedSpacePlusGas(
  readings: SensorReading[],
  permits: Permit[],
  workers: Worker[],
  zones: Zone[],
): CompoundRisk[] {
  const risks: CompoundRisk[] = [];
  const confinedPermits = permits.filter(
    (p) => p.type === 'confined-space' && (p.status === 'active' || p.status === 'approved'),
  );

  for (const permit of confinedPermits) {
    const zoneReadings = readings.filter(
      (r) => isGasSensor(r.sensorId) && sensorZone(r.sensorId) === permit.zoneId,
    );
    // above 50% of warning threshold
    const elevated = zoneReadings.filter(
      (r) => r.status === 'warning' || r.status === 'critical' || r.value > 25,
    );

    if (elevated.length > 0) {
      const factors: RiskFactor[] = [
        {
          type: 'gas-level',
          source: elevated.map((g) => g.sensorId).join(', '),
          value: Math.max(...elevated.map((g) => g.value)),
          threshold: 25,
          weight: 0.55,
          description: `Gas levels exceeding 50% of warning threshold in confined space zone ${permit.zoneId}`,
        },
        {
          type: 'permit-conflict',
          source: permit.id,
          value: 90,
          threshold: 100,
          weight: 0.45,
          description: `Active confined space entry permit "${permit.title}"`,
        },
      ];

      const score = weightedGeometricMean(factors);

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'Gas Detected in Confined Space',
        description: `Gas concentration above 50% warning threshold detected in zone ${permit.zoneId} where confined space entry permit "${permit.title}" is active. Asphyxiation and toxicity risk is elevated.`,
        contributingFactors: factors,
        affectedZones: [permit.zoneId],
        affectedWorkers: workersInZone(workers, permit.zoneId),
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: estimateLeadTime(elevated, 0.5),
        recommendedActions: [
          'Immediately extract all personnel from the confined space',
          'Activate continuous atmospheric monitoring at entry/exit points',
          'Ensure SCBA equipment is available at the entry point',
          'Verify forced ventilation is running and increasing airflow',
          'Do not re-enter until atmosphere tests confirm safe gas levels for 20+ minutes',
          'Station rescue team at the confined space entry',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// RULE 3: Shift Change + Active Permits
// ---------------------------------------------------------------------------

function rule_ShiftChangePlusPermits(
  _readings: SensorReading[],
  permits: Permit[],
  workers: Worker[],
  _zones: Zone[],
): CompoundRisk[] {
  if (!isShiftChangeover()) return [];

  const activePermits = permits.filter(
    (p) => p.status === 'active' || p.status === 'approved',
  );
  if (activePermits.length === 0) return [];

  const affectedZones = [...new Set(activePermits.map((p) => p.zoneId))];

  const factors: RiskFactor[] = [
    {
      type: 'shift-timing',
      source: 'shift-schedule',
      value: 85,
      threshold: 100,
      weight: 0.5,
      description: `Shift changeover occurring with ${activePermits.length} active permit(s)`,
    },
    {
      type: 'permit-conflict',
      source: activePermits.map((p) => p.id).join(', '),
      value: activePermits.length * 20,
      threshold: 100,
      weight: 0.5,
      description: `${activePermits.length} permits remain active during handover period`,
    },
  ];

  const score = weightedGeometricMean(factors);

  return [
    {
      id: nextRiskId(),
      severity: severityFromScore(score),
      title: 'Active Permits During Shift Changeover',
      description: `${activePermits.length} work permit(s) are active during the shift changeover window. Inadequate handover of permit responsibilities increases the risk of unauthorized work continuation or safety lapse.`,
      contributingFactors: factors,
      affectedZones,
      affectedWorkers: workersInZones(workers, affectedZones),
      compoundScore: score,
      individualScores: factors.map((f) => factorScore(f)),
      predictionLeadTime: 30,
      recommendedActions: [
        'Conduct formal permit handover briefing between outgoing and incoming shift supervisors',
        'Verify each permit holder has been replaced by a qualified incoming worker',
        'Re-validate safety conditions for all active permits post-changeover',
        'Suspend high-risk permits (hot work, confined space) during the 30-minute changeover window',
        'Log handover acknowledgments in the permit management system',
      ],
      timestamp: new Date(),
      escalationHistory: [],
    },
  ];
}

// ---------------------------------------------------------------------------
// RULE 4: High Worker Density + Equipment Alarm
// ---------------------------------------------------------------------------

function rule_HighDensityPlusAlarm(
  _readings: SensorReading[],
  _permits: Permit[],
  workers: Worker[],
  zones: Zone[],
  scadaStatus: ProcessUnit[],
): CompoundRisk[] {
  const risks: CompoundRisk[] = [];
  const alarmedUnits = scadaStatus.filter((u) => u.status === 'alarm');

  for (const unit of alarmedUnits) {
    const zone = zones.find((z) => z.id === unit.zoneId);
    if (!zone) continue;

    const zoneWorkerCount = workersInZone(workers, unit.zoneId);
    const occupancyRatio = zoneWorkerCount / Math.max(zone.maxOccupancy, 1);

    if (occupancyRatio >= 0.8) {
      const factors: RiskFactor[] = [
        {
          type: 'worker-density',
          source: unit.zoneId,
          value: occupancyRatio * 100,
          threshold: 80,
          weight: 0.5,
          description: `Zone ${zone.name} at ${Math.round(occupancyRatio * 100)}% occupancy (${zoneWorkerCount}/${zone.maxOccupancy})`,
        },
        {
          type: 'equipment-status',
          source: unit.id,
          value: 85,
          threshold: 100,
          weight: 0.5,
          description: `Equipment alarm on "${unit.name}" in zone ${zone.name}`,
        },
      ];

      const score = weightedGeometricMean(factors);

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'High Worker Density Near Equipment Alarm',
        description: `Zone "${zone.name}" is at ${Math.round(occupancyRatio * 100)}% occupancy with ${zoneWorkerCount} workers while equipment "${unit.name}" is in alarm state. Evacuation congestion risk is high.`,
        contributingFactors: factors,
        affectedZones: [unit.zoneId],
        affectedWorkers: zoneWorkerCount,
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: 15,
        recommendedActions: [
          'Immediately reduce non-essential personnel from the affected zone',
          'Pre-position evacuation marshals at all zone exits',
          'Notify emergency response team to standby',
          'Investigate and resolve equipment alarm before allowing normal staffing',
          'Verify all emergency exit routes are clear and accessible',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// RULE 5: Maintenance + Process Running
// ---------------------------------------------------------------------------

function rule_MaintenancePlusRunning(
  _readings: SensorReading[],
  _permits: Permit[],
  workers: Worker[],
  zones: Zone[],
  scadaStatus: ProcessUnit[],
): CompoundRisk[] {
  const risks: CompoundRisk[] = [];

  const maintenanceUnits = scadaStatus.filter((u) => u.status === 'maintenance');
  const runningUnits = scadaStatus.filter((u) => u.status === 'running');

  for (const mUnit of maintenanceUnits) {
    const runningInSameZone = runningUnits.filter(
      (r) => r.zoneId === mUnit.zoneId || areAdjacent(r.zoneId, mUnit.zoneId),
    );

    if (runningInSameZone.length > 0) {
      const factors: RiskFactor[] = [
        {
          type: 'maintenance-gap',
          source: mUnit.id,
          value: 75,
          threshold: 100,
          weight: 0.55,
          description: `Maintenance ongoing on "${mUnit.name}" in zone ${mUnit.zoneId}`,
        },
        {
          type: 'equipment-status',
          source: runningInSameZone.map((u) => u.id).join(', '),
          value: 70,
          threshold: 100,
          weight: 0.45,
          description: `Process equipment ${runningInSameZone.map((u) => `"${u.name}"`).join(', ')} running in same/adjacent zone`,
        },
      ];

      const score = weightedGeometricMean(factors);
      const affectedZones = [
        ...new Set([mUnit.zoneId, ...runningInSameZone.map((u) => u.zoneId)]),
      ];

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'Maintenance Activity Near Running Process',
        description: `Maintenance on "${mUnit.name}" is being performed while process equipment in the same or adjacent zone is still running. Lock-out/Tag-out (LOTO) verification required.`,
        contributingFactors: factors,
        affectedZones,
        affectedWorkers: workersInZones(workers, affectedZones),
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: 45,
        recommendedActions: [
          'Verify LOTO procedures are in place for the equipment under maintenance',
          'Confirm energy isolation between maintenance and running equipment',
          'Ensure barricades separate maintenance zone from running process area',
          'Brief maintenance crew on adjacent running equipment hazards',
          'Post danger signs at all access points to the maintenance area',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// RULE 6: Multiple Permits Overlap
// ---------------------------------------------------------------------------

function rule_MultiplePermitsOverlap(
  _readings: SensorReading[],
  permits: Permit[],
  workers: Worker[],
  _zones: Zone[],
): CompoundRisk[] {
  const activePermits = permits.filter(
    (p) => p.status === 'active' || p.status === 'approved',
  );

  // Group by zone clusters (zone + adjacent)
  const zoneClusters: Map<string, Permit[]> = new Map();

  for (const permit of activePermits) {
    const clusterKey = [permit.zoneId, ...(ZONE_ADJACENCY[permit.zoneId] ?? [])].sort().join('|');
    const existing = zoneClusters.get(clusterKey) ?? [];
    if (!existing.find((p) => p.id === permit.id)) {
      existing.push(permit);
    }
    zoneClusters.set(clusterKey, existing);
  }

  const risks: CompoundRisk[] = [];

  for (const [, clusterPermits] of zoneClusters) {
    if (clusterPermits.length >= 3) {
      const affectedZones = [...new Set(clusterPermits.map((p) => p.zoneId))];
      const factors: RiskFactor[] = [
        {
          type: 'permit-conflict',
          source: clusterPermits.map((p) => p.id).join(', '),
          value: clusterPermits.length * 25,
          threshold: 75,
          weight: 0.6,
          description: `${clusterPermits.length} active permits overlap in adjacent zones`,
        },
        {
          type: 'worker-density',
          source: affectedZones.join(', '),
          value: clusterPermits.reduce((sum, p) => sum + p.workers.length, 0) * 15,
          threshold: 100,
          weight: 0.4,
          description: `Total ${clusterPermits.reduce((s, p) => s + p.workers.length, 0)} workers engaged across overlapping permits`,
        },
      ];

      const score = weightedGeometricMean(factors);

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'Multiple Permits Overlap in Adjacent Zones',
        description: `${clusterPermits.length} permits are simultaneously active in adjacent zones: ${clusterPermits.map((p) => `"${p.title}"`).join(', ')}. Conflicting work activities and congested evacuation routes may result.`,
        contributingFactors: factors,
        affectedZones,
        affectedWorkers: workersInZones(workers, affectedZones),
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: 60,
        recommendedActions: [
          'Review all active permits for potential conflicts and dependencies',
          'Stagger work activities to reduce simultaneous high-risk operations',
          'Assign a dedicated safety officer to monitor the overlapping work areas',
          'Verify emergency evacuation routes are not blocked by any work activity',
          'Conduct a joint toolbox talk with all permit holders',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// RULE 7: Night Shift + Critical Equipment
// ---------------------------------------------------------------------------

function rule_NightShiftPlusCritical(
  readings: SensorReading[],
  _permits: Permit[],
  workers: Worker[],
  _zones: Zone[],
  _scadaStatus: ProcessUnit[],
  currentShift: ShiftType,
): CompoundRisk[] {
  if (!isNightShift(currentShift)) return [];

  const criticalReadings = readings.filter((r) => r.status === 'critical');
  if (criticalReadings.length === 0) return [];

  const affectedZones = [...new Set(criticalReadings.map((r) => sensorZone(r.sensorId)))];

  const factors: RiskFactor[] = [
    {
      type: 'shift-timing',
      source: 'night-shift',
      value: 70,
      threshold: 100,
      weight: 0.4,
      description: 'Night shift with reduced staffing and visibility',
    },
    {
      type: 'equipment-status',
      source: criticalReadings.map((r) => r.sensorId).join(', '),
      value: 90,
      threshold: 100,
      weight: 0.6,
      description: `${criticalReadings.length} sensor(s) at critical threshold: ${criticalReadings.map((r) => r.sensorId).join(', ')}`,
    },
  ];

  const score = weightedGeometricMean(factors);

  return [
    {
      id: nextRiskId(),
      severity: severityFromScore(score),
      title: 'Critical Readings During Night Shift',
      description: `${criticalReadings.length} sensor reading(s) have reached critical thresholds during night shift. Reduced staffing, lower visibility, and fatigue increase incident risk during this period.`,
      contributingFactors: factors,
      affectedZones,
      affectedWorkers: workersInZones(workers, affectedZones),
      compoundScore: score,
      individualScores: factors.map((f) => factorScore(f)),
      predictionLeadTime: estimateLeadTime(criticalReadings),
      recommendedActions: [
        'Wake and brief the on-call supervisor immediately',
        'Increase patrol frequency in affected zones',
        'Activate auxiliary lighting in areas with critical readings',
        'Ensure emergency response team is fully staffed and alert',
        'Consider partial evacuation of non-essential night crew from affected areas',
        'Document all readings and actions for morning shift handover',
      ],
      timestamp: new Date(),
      escalationHistory: [],
    },
  ];
}

// ---------------------------------------------------------------------------
// RULE 8: PPE Violation + Hazardous Zone
// ---------------------------------------------------------------------------

function rule_PPEViolationPlusHazard(
  _readings: SensorReading[],
  _permits: Permit[],
  workers: Worker[],
  zones: Zone[],
): CompoundRisk[] {
  const risks: CompoundRisk[] = [];

  const highHazardZones = zones.filter((z) => z.hazardLevel >= 7);

  for (const zone of highHazardZones) {
    const zoneWorkers = workers.filter((w) => w.currentZone === zone.id);
    const ppeViolators = zoneWorkers.filter((w) => !w.ppeCompliance);

    if (ppeViolators.length > 0) {
      const factors: RiskFactor[] = [
        {
          type: 'ppe-violation',
          source: ppeViolators.map((w) => w.id).join(', '),
          value: ppeViolators.length * 30,
          threshold: 30,
          weight: 0.55,
          description: `${ppeViolators.length} worker(s) non-compliant with PPE: ${ppeViolators.map((w) => w.name).join(', ')}`,
        },
        {
          type: 'gas-level',
          source: zone.id,
          value: zone.hazardLevel * 10,
          threshold: 70,
          weight: 0.45,
          description: `Zone "${zone.name}" has hazard level ${zone.hazardLevel}/10`,
        },
      ];

      const score = weightedGeometricMean(factors);

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'PPE Non-Compliance in High-Hazard Zone',
        description: `${ppeViolators.length} worker(s) in high-hazard zone "${zone.name}" (hazard level ${zone.hazardLevel}/10) are not wearing required PPE. Exposure to toxic gases, heat, or mechanical hazards is unmitigated.`,
        contributingFactors: factors,
        affectedZones: [zone.id],
        affectedWorkers: ppeViolators.length,
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: 10,
        recommendedActions: [
          'Immediately halt work and escort non-compliant workers to the PPE station',
          'Issue formal PPE violation notices to all non-compliant personnel',
          'Conduct spot check of all workers in the zone for proper PPE',
          'Verify PPE availability at zone entry points',
          'Brief shift supervisor on recurring PPE violations in this zone',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// RULE 9: Equipment Degradation + Gas
// ---------------------------------------------------------------------------

function rule_EquipmentDegradationPlusGas(
  readings: SensorReading[],
  _permits: Permit[],
  workers: Worker[],
  _zones: Zone[],
  scadaStatus: ProcessUnit[],
): CompoundRisk[] {
  const risks: CompoundRisk[] = [];

  const degradedUnits = scadaStatus.filter((u) => u.health < 60);

  for (const unit of degradedUnits) {
    const adjacentZones = [unit.zoneId, ...(ZONE_ADJACENCY[unit.zoneId] ?? [])];
    const gasReadings = readings.filter(
      (r) =>
        isGasSensor(r.sensorId) &&
        adjacentZones.includes(sensorZone(r.sensorId)) &&
        (r.status === 'warning' || r.status === 'critical'),
    );

    if (gasReadings.length > 0) {
      const factors: RiskFactor[] = [
        {
          type: 'equipment-status',
          source: unit.id,
          value: 100 - unit.health,
          threshold: 40,
          weight: 0.5,
          description: `Equipment "${unit.name}" health at ${unit.health}% (degraded)`,
        },
        {
          type: 'gas-level',
          source: gasReadings.map((g) => g.sensorId).join(', '),
          value: Math.max(...gasReadings.map((g) => g.value)),
          threshold: 50,
          weight: 0.5,
          description: `Elevated gas near degraded equipment: ${gasReadings.map((g) => `${g.sensorId}=${g.value}${g.unit}`).join(', ')}`,
        },
      ];

      const score = weightedGeometricMean(factors);
      const affectedZones = [...new Set(adjacentZones)];

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'Equipment Degradation with Gas Elevation',
        description: `Equipment "${unit.name}" (health: ${unit.health}%) showing degradation while gas sensors in the vicinity report elevated readings. Potential seal failure or process leak in progress.`,
        contributingFactors: factors,
        affectedZones,
        affectedWorkers: workersInZones(workers, affectedZones),
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: estimateLeadTime(gasReadings),
        recommendedActions: [
          'Initiate emergency equipment inspection on the degraded unit',
          'Deploy leak detection equipment around the degraded equipment',
          'Prepare for controlled shutdown if gas levels continue rising',
          'Notify maintenance engineering of possible seal or gasket failure',
          'Increase gas monitoring frequency to every 2 minutes in affected zones',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ---------------------------------------------------------------------------
// RULE 10: Electrical Work + Wet Conditions
// ---------------------------------------------------------------------------

function rule_ElectricalPlusWet(
  readings: SensorReading[],
  permits: Permit[],
  workers: Worker[],
  _zones: Zone[],
): CompoundRisk[] {
  const risks: CompoundRisk[] = [];

  const electricalPermits = permits.filter(
    (p) =>
      p.type === 'electrical-isolation' &&
      (p.status === 'active' || p.status === 'approved'),
  );

  for (const permit of electricalPermits) {
    const zoneReadings = readings.filter(
      (r) =>
        isHumiditySensor(r.sensorId) &&
        sensorZone(r.sensorId) === permit.zoneId,
    );
    const highHumidity = zoneReadings.filter((r) => r.value > 85);

    // Also check for any humidity readings even if not zone-specific
    const globalHighHumidity = readings.filter(
      (r) => isHumiditySensor(r.sensorId) && r.value > 85,
    );

    const wetReadings = highHumidity.length > 0 ? highHumidity : globalHighHumidity;

    if (wetReadings.length > 0) {
      const factors: RiskFactor[] = [
        {
          type: 'permit-conflict',
          source: permit.id,
          value: 80,
          threshold: 100,
          weight: 0.5,
          description: `Active electrical isolation permit "${permit.title}" in zone ${permit.zoneId}`,
        },
        {
          type: 'weather',
          source: wetReadings.map((r) => r.sensorId).join(', '),
          value: Math.max(...wetReadings.map((r) => r.value)),
          threshold: 85,
          weight: 0.5,
          description: `Humidity at ${Math.max(...wetReadings.map((r) => r.value))}% — wet conditions present`,
        },
      ];

      const score = weightedGeometricMean(factors);

      risks.push({
        id: nextRiskId(),
        severity: severityFromScore(score),
        title: 'Electrical Work in Wet Conditions',
        description: `Electrical isolation work under permit "${permit.title}" is active while humidity exceeds 85%. Electrocution risk is significantly elevated. All electrical work must be suspended.`,
        contributingFactors: factors,
        affectedZones: [permit.zoneId],
        affectedWorkers: workersInZone(workers, permit.zoneId),
        compoundScore: score,
        individualScores: factors.map((f) => factorScore(f)),
        predictionLeadTime: 20,
        recommendedActions: [
          'Immediately suspend all electrical work in the affected zone',
          'Verify all power sources are de-energized and locked out',
          'Deploy dehumidifiers or wait for conditions to normalize',
          'Inspect all electrical connections for moisture intrusion',
          'Only resume work when humidity drops below 75% for 30+ minutes',
          'Ensure all workers have insulated tools and dry gloves',
        ],
        timestamp: new Date(),
        escalationHistory: [],
      });
    }
  }

  return risks;
}

// ===========================================================================
// Main Entry Point
// ===========================================================================

/**
 * Evaluate all compound risk rules against current plant state.
 *
 * @returns Array of CompoundRisk objects sorted by descending compoundScore.
 */
export function evaluateCompoundRisks(
  sensorReadings: SensorReading[],
  activePermits: Permit[],
  workerLocations: Worker[],
  scadaStatus: ProcessUnit[],
  currentShift: ShiftType,
  zones: Zone[],
): CompoundRisk[] {
  const allRisks: CompoundRisk[] = [
    ...rule_GasPlusHotWork(sensorReadings, activePermits, workerLocations, zones),
    ...rule_ConfinedSpacePlusGas(sensorReadings, activePermits, workerLocations, zones),
    ...rule_ShiftChangePlusPermits(sensorReadings, activePermits, workerLocations, zones),
    ...rule_HighDensityPlusAlarm(sensorReadings, activePermits, workerLocations, zones, scadaStatus),
    ...rule_MaintenancePlusRunning(sensorReadings, activePermits, workerLocations, zones, scadaStatus),
    ...rule_MultiplePermitsOverlap(sensorReadings, activePermits, workerLocations, zones),
    ...rule_NightShiftPlusCritical(sensorReadings, activePermits, workerLocations, zones, scadaStatus, currentShift),
    ...rule_PPEViolationPlusHazard(sensorReadings, activePermits, workerLocations, zones),
    ...rule_EquipmentDegradationPlusGas(sensorReadings, activePermits, workerLocations, zones, scadaStatus),
    ...rule_ElectricalPlusWet(sensorReadings, activePermits, workerLocations, zones),
  ];

  // Sort by descending compound score
  return allRisks.sort((a, b) => b.compoundScore - a.compoundScore);
}

/**
 * Get a human-readable summary of all detected compound risks.
 */
export function getCompoundRiskSummary(risks: CompoundRisk[]): {
  total: number;
  emergency: number;
  critical: number;
  warning: number;
  advisory: number;
  highestScore: number;
  affectedZones: string[];
  totalAffectedWorkers: number;
} {
  return {
    total: risks.length,
    emergency: risks.filter((r) => r.severity === 'emergency').length,
    critical: risks.filter((r) => r.severity === 'critical').length,
    warning: risks.filter((r) => r.severity === 'warning').length,
    advisory: risks.filter((r) => r.severity === 'advisory').length,
    highestScore: risks.length > 0 ? Math.max(...risks.map((r) => r.compoundScore)) : 0,
    affectedZones: [...new Set(risks.flatMap((r) => r.affectedZones))],
    totalAffectedWorkers: risks.reduce((sum, r) => sum + r.affectedWorkers, 0),
  };
}
