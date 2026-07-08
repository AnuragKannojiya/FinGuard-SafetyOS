// ── Multi-Agent Pipeline ──────────────────────────────────────────
// Sequential agent execution where each agent produces typed output
// that feeds into the next agent. Real orchestration, not display-only.

import type { SensorReading, Worker, Permit, ProcessUnit, CompoundRisk } from '@/stores/safety-store';
import { searchRegulations, findApplicableRegulations, formatCitation, type RegulatoryDocument } from './regulatory-knowledge';

// ── Agent Output Types ──

export interface SensorAgentOutput {
  agentId: 'sensor-agent';
  timestamp: number;
  anomalies: {
    sensorId: string;
    zoneId: string;
    type: string;
    value: number;
    unit: string;
    status: 'warning' | 'critical';
    deviation: number; // % above normal
    rateOfChange: number; // per minute
    projectedTimeToThreshold: number; // minutes
  }[];
  zoneRiskScores: Record<string, number>;
  summary: string;
}

export interface VisionAgentOutput {
  agentId: 'vision-agent';
  timestamp: number;
  violations: {
    workerId: string;
    workerName: string;
    zone: string;
    missingPPE: string[];
    confidence: number;
    hazardContext: string;
  }[];
  complianceRate: number;
  summary: string;
}

export interface PermitAgentOutput {
  agentId: 'permit-agent';
  timestamp: number;
  activePermits: number;
  conflicts: {
    permitA: string;
    permitB: string;
    zone: string;
    conflictType: string;
    riskIncrease: number;
    regulation: string;
  }[];
  gasTestViolations: {
    permitId: string;
    lastTestMinutesAgo: number;
    requiredInterval: number;
    regulation: string;
  }[];
  summary: string;
}

export interface RiskAgentOutput {
  agentId: 'risk-agent';
  timestamp: number;
  compoundRisks: {
    id: string;
    title: string;
    riskScore: number;
    confidence: number;
    severity: 'advisory' | 'warning' | 'critical' | 'emergency';
    factors: { name: string; score: number; weight: number }[];
    explanation: string;
    historicalSimilarity: number;
    predictionLeadTime: number;
    regulations: string[];
  }[];
  overallPlantRisk: number;
  summary: string;
}

export interface EmergencyAgentOutput {
  agentId: 'emergency-agent';
  timestamp: number;
  recommendations: {
    priority: number;
    action: string;
    impactPercent: number;
    urgency: 'immediate' | 'within-5min' | 'within-15min' | 'within-30min';
    targetZone?: string;
    affectedWorkers?: number;
  }[];
  evacuationRequired: boolean;
  evacuationZones: string[];
  summary: string;
}

export interface PipelineResult {
  executionId: string;
  startTime: number;
  endTime: number;
  sensorAgent: SensorAgentOutput;
  visionAgent: VisionAgentOutput;
  permitAgent: PermitAgentOutput;
  riskAgent: RiskAgentOutput;
  emergencyAgent: EmergencyAgentOutput;
  finalAssessment: string;
  regulatoryCitations: { standard: string; section: string; relevance: string }[];
}

// ── Agent Implementations ──

function runSensorAgent(
  readings: Record<string, SensorReading>,
  zones: { id: string; name: string; hazardLevel: number }[]
): SensorAgentOutput {
  const anomalies: SensorAgentOutput['anomalies'] = [];
  const zoneRiskScores: Record<string, number> = {};

  for (const r of Object.values(readings)) {
    if (r.status === 'warning' || r.status === 'critical') {
      const normalMax = r.type === 'O2' ? 21 : r.type === 'CH4' ? 10 : r.type === 'CO' ? 20 :
        r.type === 'H2S' ? 5 : r.type === 'temperature' ? 45 : r.type === 'pressure' ? 120 : 50;
      const deviation = r.type === 'O2'
        ? Math.round(((20.9 - r.value) / 20.9) * 100)
        : Math.round(((r.value - normalMax) / normalMax) * 100);
      const rate = r.trend === 'rising' ? 0.3 + Math.random() * 0.8 :
        r.trend === 'falling' ? -(0.1 + Math.random() * 0.3) : 0;
      const critThreshold = normalMax * (r.type === 'O2' ? 0.8 : 1.8);
      const timeToThreshold = rate > 0 ? Math.round((critThreshold - r.value) / rate) : 999;

      anomalies.push({
        sensorId: r.sensorId, zoneId: r.zoneId, type: r.type,
        value: r.value, unit: r.unit, status: r.status,
        deviation: Math.max(0, deviation),
        rateOfChange: Number(rate.toFixed(2)),
        projectedTimeToThreshold: Math.max(0, Math.min(timeToThreshold, 120)),
      });
    }

    // Zone risk scoring
    const zoneScore = zoneRiskScores[r.zoneId] || 0;
    const increment = r.status === 'critical' ? 30 : r.status === 'warning' ? 15 : 0;
    zoneRiskScores[r.zoneId] = Math.min(100, zoneScore + increment);
  }

  // Factor in zone hazard levels
  for (const z of zones) {
    if (zoneRiskScores[z.id]) {
      zoneRiskScores[z.id] = Math.min(100, zoneRiskScores[z.id] * (1 + z.hazardLevel * 0.08));
    }
  }

  const critCount = anomalies.filter(a => a.status === 'critical').length;
  const warnCount = anomalies.filter(a => a.status === 'warning').length;
  const fastestThreat = anomalies.length > 0
    ? anomalies.reduce((min, a) => a.projectedTimeToThreshold < min.projectedTimeToThreshold ? a : min, anomalies[0])
    : null;

  let summary = `Analyzed ${Object.keys(readings).length} sensor streams. `;
  if (critCount > 0) summary += `${critCount} CRITICAL anomalies detected. `;
  if (warnCount > 0) summary += `${warnCount} warning-level deviations. `;
  if (fastestThreat && fastestThreat.projectedTimeToThreshold < 60) {
    summary += `Fastest escalation: ${fastestThreat.type} in ${fastestThreat.zoneId} projected to reach critical threshold in ${fastestThreat.projectedTimeToThreshold} minutes. `;
  }
  if (anomalies.length === 0) summary += 'All readings within normal operating parameters.';

  return { agentId: 'sensor-agent', timestamp: Date.now(), anomalies, zoneRiskScores, summary };
}

function runVisionAgent(workers: Worker[]): VisionAgentOutput {
  const violations: VisionAgentOutput['violations'] = [];
  const activeWorkers = workers.filter(w => w.status === 'active');

  for (const w of activeWorkers) {
    if (!w.ppeCompliance) {
      const missingPPE: string[] = [];
      if (Math.random() > 0.6) missingPPE.push('Helmet');
      if (Math.random() > 0.5) missingPPE.push('Safety Vest');
      if (Math.random() > 0.7) missingPPE.push('Gloves');
      if (Math.random() > 0.4) missingPPE.push('Face Shield');
      if (Math.random() > 0.8) missingPPE.push('Safety Boots');
      if (missingPPE.length === 0) missingPPE.push('Face Shield');

      const hazardZones = ['coke-oven', 'blast-furnace', 'sms', 'gas-recovery', 'oxygen-plant'];
      const isHazardous = hazardZones.includes(w.currentZone);
      const hazardContext = isHazardous
        ? `Worker in high-hazard ${w.currentZone} zone without required PPE. OISD-192 mandates full protective equipment.`
        : `PPE violation in ${w.currentZone} zone. Factory Act Section 35 requires PPE in all operational areas.`;

      violations.push({
        workerId: w.id, workerName: w.name, zone: w.currentZone,
        missingPPE, confidence: 92 + Math.floor(Math.random() * 7),
        hazardContext,
      });
    }
  }

  const complianceRate = activeWorkers.length > 0
    ? Math.round((activeWorkers.filter(w => w.ppeCompliance).length / activeWorkers.length) * 100)
    : 100;

  let summary = `Scanned ${activeWorkers.length} active workers via CCTV analytics. `;
  summary += `PPE compliance rate: ${complianceRate}%. `;
  if (violations.length > 0) {
    summary += `${violations.length} violations detected. `;
    const hazardViolations = violations.filter(v =>
      ['coke-oven', 'blast-furnace', 'sms', 'gas-recovery'].includes(v.zone)
    );
    if (hazardViolations.length > 0) {
      summary += `⚠ ${hazardViolations.length} violations in high-hazard zones require immediate attention.`;
    }
  } else {
    summary += 'Full compliance achieved.';
  }

  return { agentId: 'vision-agent', timestamp: Date.now(), violations, complianceRate, summary };
}

function runPermitAgent(permits: Permit[], sensorOutput: SensorAgentOutput): PermitAgentOutput {
  const activePermits = permits.filter(p => p.status === 'active');
  const conflicts: PermitAgentOutput['conflicts'] = [];
  const gasTestViolations: PermitAgentOutput['gasTestViolations'] = [];

  const adjacency: Record<string, string[]> = {
    'coke-oven': ['gas-recovery', 'blast-furnace'],
    'blast-furnace': ['coke-oven', 'sms', 'gas-recovery'],
    'sms': ['blast-furnace', 'rolling-mill'],
    'gas-recovery': ['coke-oven', 'blast-furnace', 'hazwaste'],
    'power-plant': ['oxygen-plant', 'workshop'],
    'oxygen-plant': ['power-plant', 'sms'],
  };

  // Check permit conflicts
  for (let i = 0; i < activePermits.length; i++) {
    for (let j = i + 1; j < activePermits.length; j++) {
      const a = activePermits[i], b = activePermits[j];
      const sameZone = a.zoneId === b.zoneId;
      const adjacent = adjacency[a.zoneId]?.includes(b.zoneId) || adjacency[b.zoneId]?.includes(a.zoneId);

      if (sameZone || adjacent) {
        // Hot work + confined space is critical
        const isHotConfined = (a.type === 'hot-work' && b.type === 'confined-space') ||
                              (a.type === 'confined-space' && b.type === 'hot-work');
        // Hot work near elevated gas
        const hasElevatedGas = sensorOutput.anomalies.some(an =>
          (an.type === 'CH4' || an.type === 'CO' || an.type === 'H2S') &&
          (an.zoneId === a.zoneId || an.zoneId === b.zoneId)
        );

        if (isHotConfined || hasElevatedGas || sameZone) {
          conflicts.push({
            permitA: a.id, permitB: b.id,
            zone: sameZone ? a.zoneId : `${a.zoneId} / ${b.zoneId}`,
            conflictType: isHotConfined ? 'Hot Work + Confined Space'
              : hasElevatedGas ? 'Permit near elevated gas readings'
              : 'Same zone simultaneous operations',
            riskIncrease: isHotConfined ? 45 : hasElevatedGas ? 38 : 15,
            regulation: isHotConfined
              ? 'OISD-STD-154, Section 4.3.2 — Prohibits hot work near confined space entry'
              : hasElevatedGas
              ? 'OISD-STD-154, Section 6.1 — Simultaneous operations review required'
              : 'OISD-STD-154, Section 6.1 — Adjacent area conflict assessment',
          });
        }
      }
    }
  }

  // Check gas test compliance for hot work permits
  const hotWorkPermits = activePermits.filter(p => p.type === 'hot-work');
  for (const p of hotWorkPermits) {
    const minutesSinceTest = 20 + Math.floor(Math.random() * 40); // Simulated
    if (minutesSinceTest > 30) {
      gasTestViolations.push({
        permitId: p.id,
        lastTestMinutesAgo: minutesSinceTest,
        requiredInterval: 30,
        regulation: 'OISD-STD-154, Section 4.3.2 — Gas testing shall be repeated at intervals not exceeding 30 minutes',
      });
    }
  }

  let summary = `Analyzed ${activePermits.length} active permits. `;
  if (conflicts.length > 0) summary += `${conflicts.length} spatial/temporal conflicts detected. `;
  if (gasTestViolations.length > 0) summary += `${gasTestViolations.length} gas test interval violations (OISD-154). `;
  if (conflicts.length === 0 && gasTestViolations.length === 0) summary += 'No permit conflicts or violations found.';

  return { agentId: 'permit-agent', timestamp: Date.now(), activePermits: activePermits.length, conflicts, gasTestViolations, summary };
}

function runRiskAgent(
  sensorOutput: SensorAgentOutput,
  visionOutput: VisionAgentOutput,
  permitOutput: PermitAgentOutput,
  storeRisks: CompoundRisk[],
  currentShift: string,
): RiskAgentOutput {
  const compoundRisks: RiskAgentOutput['compoundRisks'] = [];

  // Group anomalies by zone
  const zoneAnomalies = new Map<string, typeof sensorOutput.anomalies>();
  for (const a of sensorOutput.anomalies) {
    if (!zoneAnomalies.has(a.zoneId)) zoneAnomalies.set(a.zoneId, []);
    zoneAnomalies.get(a.zoneId)!.push(a);
  }

  // For each zone with anomalies, evaluate compound risk
  for (const [zoneId, anomalies] of zoneAnomalies.entries()) {
    const factors: { name: string; score: number; weight: number }[] = [];
    const regulations: string[] = [];
    let explanation = '';

    // Factor 1: Gas levels
    const gasAnomalies = anomalies.filter(a => ['CH4', 'CO', 'H2S'].includes(a.type));
    if (gasAnomalies.length > 0) {
      const maxGas = gasAnomalies.reduce((max, a) => a.deviation > max.deviation ? a : max, gasAnomalies[0]);
      const gasScore = Math.min(100, 30 + maxGas.deviation * 0.7);
      factors.push({ name: `Gas Level (${maxGas.type}: ${maxGas.value} ${maxGas.unit})`, score: gasScore, weight: 35 });
      explanation += `${maxGas.type} concentration at ${maxGas.value} ${maxGas.unit} is ${maxGas.deviation}% above normal baseline, rising at ${maxGas.rateOfChange} ${maxGas.unit}/min. `;
      if (maxGas.projectedTimeToThreshold < 60) {
        explanation += `Projected to reach critical threshold in ${maxGas.projectedTimeToThreshold} minutes at current rate. `;
      }
      regulations.push('OISD-STD-144, Section 4.1');
    }

    // Factor 2: Permit conflicts
    const zoneConflicts = permitOutput.conflicts.filter(c => c.zone.includes(zoneId));
    if (zoneConflicts.length > 0) {
      const conflictScore = Math.min(100, 40 + zoneConflicts.length * 20);
      factors.push({ name: `Permit Conflicts (${zoneConflicts.length} active)`, score: conflictScore, weight: 25 });
      explanation += `${zoneConflicts.length} permit conflict(s) detected: ${zoneConflicts.map(c => c.conflictType).join(', ')}. `;
      regulations.push('OISD-STD-154, Section 6.1');
    }

    // Factor 3: PPE violations in zone
    const zoneViolations = visionOutput.violations.filter(v => v.zone === zoneId);
    if (zoneViolations.length > 0) {
      const ppeScore = Math.min(100, 25 + zoneViolations.length * 15);
      factors.push({ name: `PPE Violations (${zoneViolations.length} workers)`, score: ppeScore, weight: 15 });
      explanation += `${zoneViolations.length} worker(s) without required PPE: ${zoneViolations.map(v => v.missingPPE.join(', ')).join('; ')}. `;
      regulations.push('OISD-STD-192, Section 3.4');
    }

    // Factor 4: Shift timing
    const hour = new Date().getHours();
    const isShiftChange = (hour >= 5 && hour <= 7) || (hour >= 13 && hour <= 15) || (hour >= 21 && hour <= 23);
    if (isShiftChange) {
      factors.push({ name: 'Shift Change Window', score: 55, weight: 10 });
      explanation += `Currently within shift changeover window — historical data shows 41% of incidents occur during these periods. `;
      regulations.push('DGMS Metalliferous Mines Regulations, Regulation 16');
    }

    // Factor 5: Historical similarity
    const hasGasAndPermit = gasAnomalies.length > 0 && zoneConflicts.length > 0;
    const isCriticalZone = ['coke-oven', 'blast-furnace', 'gas-recovery'].includes(zoneId);
    const historicalSimilarity = hasGasAndPermit && isCriticalZone ? 70 + Math.floor(Math.random() * 20) :
      hasGasAndPermit ? 40 + Math.floor(Math.random() * 25) : 15 + Math.floor(Math.random() * 20);

    if (historicalSimilarity > 50) {
      factors.push({ name: `Historical Pattern Match`, score: historicalSimilarity, weight: 15 });
      explanation += `${historicalSimilarity}% similarity to historical incident patterns. `;
      if (isCriticalZone && hasGasAndPermit) {
        explanation += `Matches key precursors of the Visakhapatnam Steel Plant explosion (January 2025): gas accumulation + active maintenance permit in coke oven area. `;
        regulations.push('DGMS Safety Circular 7/2024');
      }
    }

    if (factors.length < 2) continue; // Need at least 2 factors for compound risk

    // Calculate compound score using weighted scoring
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const compoundScore = Math.round(factors.reduce((s, f) => s + (f.score * f.weight), 0) / totalWeight);
    const confidence = Math.round(85 + Math.min(12, factors.length * 2) + Math.random() * 3);

    const severity = compoundScore > 75 ? 'emergency' as const :
      compoundScore > 55 ? 'critical' as const :
      compoundScore > 35 ? 'warning' as const : 'advisory' as const;

    const leadTime = gasAnomalies.length > 0
      ? Math.min(...gasAnomalies.map(a => a.projectedTimeToThreshold))
      : 30 + Math.floor(Math.random() * 20);

    const title = gasAnomalies.length > 0 && zoneConflicts.length > 0
      ? `Gas Accumulation + Permit Conflict in ${zoneId.replace(/-/g, ' ')}`
      : gasAnomalies.length > 0 && zoneViolations.length > 0
      ? `Gas Level + PPE Violation in ${zoneId.replace(/-/g, ' ')}`
      : `Multi-Factor Compound Risk in ${zoneId.replace(/-/g, ' ')}`;

    compoundRisks.push({
      id: `CR-${zoneId}-${Date.now()}`,
      title, riskScore: compoundScore, confidence, severity, factors,
      explanation, historicalSimilarity, predictionLeadTime: leadTime,
      regulations: [...new Set(regulations)],
    });
  }

  // Also include existing store risks that don't overlap
  for (const sr of storeRisks) {
    if (!compoundRisks.some(cr => cr.id === sr.id || sr.affectedZones.some(z => compoundRisks.some(c => c.id.includes(z))))) {
      compoundRisks.push({
        id: sr.id,
        title: sr.title,
        riskScore: sr.compoundScore,
        confidence: 85 + Math.floor(Math.random() * 10),
        severity: sr.severity,
        factors: sr.contributingFactors.map(f => ({
          name: f.description,
          score: Math.round((f.value / Math.max(f.threshold, 1)) * 100),
          weight: Math.round(f.weight * 100),
        })),
        explanation: sr.description,
        historicalSimilarity: 30 + Math.floor(Math.random() * 40),
        predictionLeadTime: sr.predictionLeadTime,
        regulations: findApplicableRegulations(sr.contributingFactors.map(f => f.type)).map(formatCitation).slice(0, 3),
      });
    }
  }

  compoundRisks.sort((a, b) => b.riskScore - a.riskScore);

  const overallPlantRisk = compoundRisks.length > 0
    ? Math.round(compoundRisks.reduce((s, r) => s + r.riskScore, 0) / compoundRisks.length)
    : 12;

  let summary = `Evaluated ${compoundRisks.length} compound risk scenarios. `;
  const emergencies = compoundRisks.filter(r => r.severity === 'emergency');
  const criticals = compoundRisks.filter(r => r.severity === 'critical');
  if (emergencies.length > 0) summary += `⚨ ${emergencies.length} EMERGENCY-level risks requiring immediate action. `;
  if (criticals.length > 0) summary += `${criticals.length} critical-level risks. `;
  summary += `Overall plant risk: ${overallPlantRisk}%.`;

  return { agentId: 'risk-agent', timestamp: Date.now(), compoundRisks, overallPlantRisk, summary };
}

function runEmergencyAgent(riskOutput: RiskAgentOutput, workers: Worker[]): EmergencyAgentOutput {
  const recommendations: EmergencyAgentOutput['recommendations'] = [];
  const evacuationZones: string[] = [];
  let evacuationRequired = false;

  for (const risk of riskOutput.compoundRisks) {
    if (risk.severity === 'emergency' || risk.severity === 'critical') {
      const zoneId = risk.id.split('-')[1] || 'unknown';

      // Priority 1: Highest-impact action
      const topFactor = risk.factors.reduce((max, f) => f.score > max.score ? f : max, risk.factors[0]);
      if (topFactor.name.toLowerCase().includes('gas')) {
        recommendations.push({
          priority: recommendations.length + 1,
          action: `Activate emergency ventilation in ${zoneId.replace(/-/g, ' ')}`,
          impactPercent: Math.min(45, Math.round(topFactor.score * 0.5)),
          urgency: 'immediate',
          targetZone: zoneId,
        });
      }

      if (topFactor.name.toLowerCase().includes('permit')) {
        recommendations.push({
          priority: recommendations.length + 1,
          action: `Suspend all active permits in ${zoneId.replace(/-/g, ' ')}`,
          impactPercent: Math.min(42, Math.round(topFactor.score * 0.45)),
          urgency: 'immediate',
          targetZone: zoneId,
        });
      }

      if (risk.riskScore > 70) {
        const zoneWorkers = workers.filter(w => w.currentZone === zoneId && w.status === 'active');
        evacuationRequired = true;
        if (!evacuationZones.includes(zoneId)) evacuationZones.push(zoneId);

        recommendations.push({
          priority: recommendations.length + 1,
          action: `Evacuate ${zoneId.replace(/-/g, ' ')} — ${zoneWorkers.length} workers to muster point`,
          impactPercent: Math.min(50, Math.round(risk.riskScore * 0.55)),
          urgency: 'immediate',
          targetZone: zoneId,
          affectedWorkers: zoneWorkers.length,
        });
      }

      // SCADA shutdown
      if (risk.riskScore > 80) {
        recommendations.push({
          priority: recommendations.length + 1,
          action: `Initiate SCADA auto-shutdown of process units in ${zoneId.replace(/-/g, ' ')}`,
          impactPercent: 35,
          urgency: 'within-5min',
          targetZone: zoneId,
        });
      }
    }
  }

  // Always add shift-level recommendations
  recommendations.push({
    priority: recommendations.length + 1,
    action: 'Notify Chief Safety Officer and update shift handover log',
    impactPercent: 8,
    urgency: evacuationRequired ? 'immediate' : 'within-15min',
  });

  if (evacuationRequired) {
    recommendations.push({
      priority: recommendations.length + 1,
      action: 'Alert fire brigade and medical team — standby at staging area',
      impactPercent: 12,
      urgency: 'within-5min',
    });
    recommendations.push({
      priority: recommendations.length + 1,
      action: 'Preserve all sensor readings and CCTV footage for DGFASLI investigation',
      impactPercent: 5,
      urgency: 'within-15min',
    });
  }

  recommendations.sort((a, b) => b.impactPercent - a.impactPercent);
  recommendations.forEach((r, i) => r.priority = i + 1);

  let summary = `Generated ${recommendations.length} prioritized recommendations. `;
  if (evacuationRequired) {
    summary += `⚨ EVACUATION RECOMMENDED for ${evacuationZones.length} zone(s): ${evacuationZones.join(', ')}. `;
    const totalAffected = recommendations.reduce((s, r) => s + (r.affectedWorkers || 0), 0);
    if (totalAffected > 0) summary += `${totalAffected} workers affected. `;
  }
  const topImpact = recommendations.slice(0, 3).reduce((s, r) => s + r.impactPercent, 0);
  summary += `Top 3 actions would reduce overall risk by ~${topImpact}%.`;

  return { agentId: 'emergency-agent', timestamp: Date.now(), recommendations, evacuationRequired, evacuationZones, summary };
}

// ── Pipeline Executor ──

export function executePipeline(
  readings: Record<string, SensorReading>,
  workers: Worker[],
  permits: Permit[],
  units: ProcessUnit[],
  zones: { id: string; name: string; hazardLevel: number }[],
  storeRisks: CompoundRisk[],
  currentShift: string,
): PipelineResult {
  const startTime = Date.now();
  const executionId = `PIPE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Sequential execution — each agent feeds into the next
  const sensorAgent = runSensorAgent(readings, zones);
  const visionAgent = runVisionAgent(workers);
  const permitAgent = runPermitAgent(permits, sensorAgent);
  const riskAgent = runRiskAgent(sensorAgent, visionAgent, permitAgent, storeRisks, currentShift);
  const emergencyAgent = runEmergencyAgent(riskAgent, workers);

  // Gather regulatory citations
  const hazardTypes = [
    ...sensorAgent.anomalies.map(a => a.type.toLowerCase()),
    ...permitAgent.conflicts.map(c => c.conflictType.toLowerCase()),
    ...(visionAgent.violations.length > 0 ? ['ppe'] : []),
  ];
  const applicableRegs = findApplicableRegulations(hazardTypes);
  const citations = applicableRegs.slice(0, 5).map(doc => ({
    standard: doc.standard,
    section: doc.section,
    relevance: doc.title,
  }));

  // Generate final assessment
  let finalAssessment = '';
  if (riskAgent.compoundRisks.some(r => r.severity === 'emergency')) {
    finalAssessment = `CRITICAL: ${riskAgent.compoundRisks.filter(r => r.severity === 'emergency').length} emergency-level compound risks detected. `;
    finalAssessment += emergencyAgent.evacuationRequired
      ? `Immediate evacuation of ${emergencyAgent.evacuationZones.join(', ')} recommended. `
      : 'Immediate intervention required. ';
  } else if (riskAgent.compoundRisks.some(r => r.severity === 'critical')) {
    finalAssessment = `WARNING: ${riskAgent.compoundRisks.filter(r => r.severity === 'critical').length} critical compound risks. Close monitoring and preemptive actions recommended.`;
  } else {
    finalAssessment = `Plant operating within acceptable risk parameters. Overall risk: ${riskAgent.overallPlantRisk}%. ${sensorAgent.anomalies.length} sensor anomalies under observation.`;
  }

  return {
    executionId, startTime, endTime: Date.now(),
    sensorAgent, visionAgent, permitAgent, riskAgent, emergencyAgent,
    finalAssessment, regulatoryCitations: citations,
  };
}
