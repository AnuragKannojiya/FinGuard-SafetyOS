// =============================================================================
// FinGuard SafetyOS — Regulatory Compliance Agent
// =============================================================================
// Maintains a database of 30+ regulatory requirements from OISD, Factory Act
// 1948, and DGMS standards. Provides compliance auditing, corrective action
// generation, inspection scheduling, and compliance trend tracking.
// =============================================================================

import type {
  ComplianceRequirement,
  ComplianceAuditResult,
  CorrectiveAction,
  ScheduledInspection,
  ComplianceTrendPoint,
  ComplianceCategory,
  ComplianceStatus,
  CheckType,
  CheckFrequency,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

let corrActionCounter = 0;
function nextCorrectiveActionId(): string {
  corrActionCounter += 1;
  return `CA-${Date.now().toString(36)}-${corrActionCounter.toString().padStart(3, '0')}`;
}

let inspectionCounter = 0;
function nextInspectionId(): string {
  inspectionCounter += 1;
  return `INS-${Date.now().toString(36)}-${inspectionCounter.toString().padStart(3, '0')}`;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Seeded pseudo-random for deterministic simulated status
// ---------------------------------------------------------------------------

function seededStatus(id: string): ComplianceStatus {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const val = Math.abs(hash) % 100;
  if (val < 60) return 'compliant';
  if (val < 75) return 'partial';
  if (val < 90) return 'non-compliant';
  return 'pending';
}

function seededScore(id: string, status: ComplianceStatus): number {
  if (status === 'compliant') return randomBetween(85, 100);
  if (status === 'partial') return randomBetween(50, 84);
  if (status === 'non-compliant') return randomBetween(10, 49);
  return 0;
}

function seededDeviations(
  id: string,
  status: ComplianceStatus,
  title: string,
): string[] {
  if (status === 'compliant') return [];
  if (status === 'pending') return [`${title}: Inspection not yet completed`];

  const deviationPool: string[] = [
    `${title}: Documentation not updated within prescribed frequency`,
    `${title}: Training records incomplete for 3 personnel`,
    `${title}: Equipment calibration overdue by 15 days`,
    `${title}: Inspection report not signed by competent authority`,
    `${title}: Emergency drill not conducted within 90-day window`,
    `${title}: PPE inventory below minimum stock threshold`,
    `${title}: Safety signage missing or faded in 2 zones`,
    `${title}: Permit register not maintained in prescribed format`,
    `${title}: Fire extinguisher service date exceeded`,
    `${title}: Electrical earthing resistance not within limits`,
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }

  const count = status === 'non-compliant' ? 2 : 1;
  const startIdx = Math.abs(hash) % deviationPool.length;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(deviationPool[(startIdx + i) % deviationPool.length]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Regulatory Requirements Database (30+ requirements)
// ---------------------------------------------------------------------------

interface RequirementDefinition {
  id: string;
  standard: string;
  clause: string;
  title: string;
  description: string;
  category: ComplianceCategory;
  checkType: CheckType;
  frequency: CheckFrequency;
}

const REQUIREMENT_DEFINITIONS: RequirementDefinition[] = [
  // ===== OISD-144: Oil/Gas Processing Installations =====
  {
    id: 'OISD-144-01',
    standard: 'OISD-144',
    clause: '5.1.1',
    title: 'Hydrocarbon Gas Detection System',
    description:
      'All process areas handling hydrocarbon shall be provided with fixed gas detection system capable of detecting combustible gases at 20% LEL.',
    category: 'Gas Detection',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'OISD-144-02',
    standard: 'OISD-144',
    clause: '5.1.3',
    title: 'H2S Gas Detection',
    description:
      'H2S detectors shall be installed in areas where H2S concentration may exceed 10 ppm. Alarms at 10 ppm (low) and 20 ppm (high).',
    category: 'Gas Detection',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'OISD-144-03',
    standard: 'OISD-144',
    clause: '6.2.1',
    title: 'Fire Water System Pressure',
    description:
      'Fire water system shall maintain minimum 7 kg/cm² pressure at the remotest hydrant point. Pressure to be checked daily.',
    category: 'Fire Safety',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'OISD-144-04',
    standard: 'OISD-144',
    clause: '6.3.2',
    title: 'Fire Extinguisher Inspection',
    description:
      'All portable fire extinguishers shall be inspected monthly and hydro-tested every 3 years per IS 2190.',
    category: 'Fire Safety',
    checkType: 'manual',
    frequency: 'monthly',
  },
  {
    id: 'OISD-144-05',
    standard: 'OISD-144',
    clause: '7.1.1',
    title: 'Emergency Shutdown System Test',
    description:
      'Emergency shutdown (ESD) systems shall be function-tested quarterly to ensure all trip functions activate within design parameters.',
    category: 'Emergency Preparedness',
    checkType: 'manual',
    frequency: 'quarterly',
  },

  // ===== OISD-145: Work Permit System =====
  {
    id: 'OISD-145-01',
    standard: 'OISD-145',
    clause: '4.1',
    title: 'Work Permit Procedure',
    description:
      'No maintenance, repair, or construction work shall be carried out without a valid work permit issued by an authorized person.',
    category: 'Permit-to-Work',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'OISD-145-02',
    standard: 'OISD-145',
    clause: '4.3.1',
    title: 'Hot Work Permit Gas Testing',
    description:
      'Gas testing shall be carried out by a competent person before issuing hot work permit. LEL shall be less than 1%.',
    category: 'Permit-to-Work',
    checkType: 'manual',
    frequency: 'daily',
  },
  {
    id: 'OISD-145-03',
    standard: 'OISD-145',
    clause: '4.5',
    title: 'Confined Space Entry Certificate',
    description:
      'Entry into confined spaces requires a valid entry certificate with atmospheric testing for O2 (19.5-23.5%), LEL (<1%), and toxic gases.',
    category: 'Permit-to-Work',
    checkType: 'manual',
    frequency: 'daily',
  },
  {
    id: 'OISD-145-04',
    standard: 'OISD-145',
    clause: '4.7',
    title: 'Electrical Isolation Procedure',
    description:
      'Electrical isolation shall follow lock-out/tag-out (LOTO) procedure as per OISD-145. All isolation points shall be verified dead.',
    category: 'Electrical Safety',
    checkType: 'manual',
    frequency: 'daily',
  },

  // ===== OISD-154: Safety Instrumented Systems =====
  {
    id: 'OISD-154-01',
    standard: 'OISD-154',
    clause: '3.2',
    title: 'Safety Integrity Level Verification',
    description:
      'All Safety Instrumented Systems (SIS) shall be verified to meet their assigned SIL level through proof testing at prescribed intervals.',
    category: 'Equipment Inspection',
    checkType: 'manual',
    frequency: 'annual',
  },
  {
    id: 'OISD-154-02',
    standard: 'OISD-154',
    clause: '4.1',
    title: 'Pressure Relief Valve Testing',
    description:
      'All pressure relief valves shall be tested and set at their design set pressure. Records of test results shall be maintained.',
    category: 'Equipment Inspection',
    checkType: 'manual',
    frequency: 'annual',
  },
  {
    id: 'OISD-154-03',
    standard: 'OISD-154',
    clause: '5.3',
    title: 'Control System Redundancy',
    description:
      'Critical control loops shall have redundant sensors, logic solvers, and final control elements. Redundancy shall be tested quarterly.',
    category: 'Equipment Inspection',
    checkType: 'automated',
    frequency: 'quarterly',
  },

  // ===== OISD-192: Safety Practices for Petroleum Handling =====
  {
    id: 'OISD-192-01',
    standard: 'OISD-192',
    clause: '3.1',
    title: 'Static Grounding and Bonding',
    description:
      'All petroleum handling equipment shall be properly grounded and bonded. Earth resistance shall not exceed 10 ohms.',
    category: 'Electrical Safety',
    checkType: 'manual',
    frequency: 'quarterly',
  },
  {
    id: 'OISD-192-02',
    standard: 'OISD-192',
    clause: '4.2',
    title: 'Tank Farm Fire Protection',
    description:
      'Fixed foam systems for storage tanks shall be tested semi-annually. Foam concentrate quality shall be verified annually.',
    category: 'Fire Safety',
    checkType: 'manual',
    frequency: 'quarterly',
  },
  {
    id: 'OISD-192-03',
    standard: 'OISD-192',
    clause: '5.1',
    title: 'Pipeline Cathodic Protection',
    description:
      'Underground pipelines shall be protected by cathodic protection system. CP potential shall be measured monthly.',
    category: 'Structural Integrity',
    checkType: 'automated',
    frequency: 'monthly',
  },

  // ===== Factory Act 1948 =====
  {
    id: 'FA-1948-01',
    standard: 'Factory Act 1948',
    clause: 'Section 7A',
    title: 'Safety Policy Documentation',
    description:
      'Every factory shall prepare a written statement of safety policy and bring it to the notice of all workers. To be reviewed annually.',
    category: 'Training',
    checkType: 'documentation',
    frequency: 'annual',
  },
  {
    id: 'FA-1948-02',
    standard: 'Factory Act 1948',
    clause: 'Section 11',
    title: 'Cleanliness and Housekeeping',
    description:
      'Every factory shall be kept clean and free from effluvia arising from any drain, privy or other nuisance. Inspections shall be regular.',
    category: 'Environmental',
    checkType: 'manual',
    frequency: 'weekly',
  },
  {
    id: 'FA-1948-03',
    standard: 'Factory Act 1948',
    clause: 'Section 13',
    title: 'Ventilation and Temperature',
    description:
      'Adequate ventilation shall be provided. Temperature in work rooms shall not rise unreasonably above the atmospheric temperature.',
    category: 'Environmental',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'FA-1948-04',
    standard: 'Factory Act 1948',
    clause: 'Section 21',
    title: 'Fencing of Machinery',
    description:
      'Every moving part of a prime mover, flywheel, and every dangerous part of machinery shall be securely fenced by safeguards.',
    category: 'Equipment Inspection',
    checkType: 'manual',
    frequency: 'monthly',
  },
  {
    id: 'FA-1948-05',
    standard: 'Factory Act 1948',
    clause: 'Section 36A',
    title: 'Maximum Permissible Limits of Chemicals',
    description:
      'The concentration of chemicals in the work environment shall not exceed maximum permissible limits prescribed in Schedule II.',
    category: 'Gas Detection',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'FA-1948-06',
    standard: 'Factory Act 1948',
    clause: 'Section 38',
    title: 'Precautions Against Fire',
    description:
      'Every factory shall have adequate fire-fighting equipment, fire exits clearly marked, and evacuation procedures displayed.',
    category: 'Fire Safety',
    checkType: 'manual',
    frequency: 'monthly',
  },
  {
    id: 'FA-1948-07',
    standard: 'Factory Act 1948',
    clause: 'Section 40',
    title: 'Safety Officer Appointment',
    description:
      'Every factory employing 1000+ workers or engaged in hazardous process shall appoint a qualified Safety Officer.',
    category: 'Training',
    checkType: 'documentation',
    frequency: 'annual',
  },
  {
    id: 'FA-1948-08',
    standard: 'Factory Act 1948',
    clause: 'Section 41B',
    title: 'Emergency Preparedness Plan',
    description:
      'Every factory involved in hazardous processes shall prepare an on-site emergency plan, reviewed and rehearsed annually.',
    category: 'Emergency Preparedness',
    checkType: 'documentation',
    frequency: 'annual',
  },
  {
    id: 'FA-1948-09',
    standard: 'Factory Act 1948',
    clause: 'Section 41C',
    title: 'Safety Committee',
    description:
      'Every factory with 250+ workers shall constitute a Safety Committee comprising equal representation of management and workers.',
    category: 'Training',
    checkType: 'documentation',
    frequency: 'quarterly',
  },

  // ===== DGMS (Directorate General of Mines Safety) =====
  {
    id: 'DGMS-01',
    standard: 'DGMS',
    clause: 'CMR Reg 176',
    title: 'Methane Detection in Mines',
    description:
      'Continuous methane monitoring shall be provided in all active working areas. Alarm at 1% CH4, trip at 1.5% CH4.',
    category: 'Gas Detection',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'DGMS-02',
    standard: 'DGMS',
    clause: 'CMR Reg 182',
    title: 'Mine Ventilation System',
    description:
      'Every mine shall have an adequate ventilation system ensuring minimum 6 m³/min airflow per person in working areas.',
    category: 'Environmental',
    checkType: 'automated',
    frequency: 'daily',
  },
  {
    id: 'DGMS-03',
    standard: 'DGMS',
    clause: 'MMR 2017 S.29',
    title: 'Mine Emergency Response Plan',
    description:
      'A comprehensive emergency response plan shall be prepared covering fire, explosion, inundation, and ground failure. Mock drills quarterly.',
    category: 'Emergency Preparedness',
    checkType: 'documentation',
    frequency: 'quarterly',
  },
  {
    id: 'DGMS-04',
    standard: 'DGMS',
    clause: 'CMR Reg 93',
    title: 'Electrical Equipment in Hazardous Areas',
    description:
      'Only flameproof or intrinsically safe electrical equipment shall be used in areas with potential explosive atmosphere.',
    category: 'Electrical Safety',
    checkType: 'manual',
    frequency: 'monthly',
  },
  {
    id: 'DGMS-05',
    standard: 'DGMS',
    clause: 'CMR Reg 191',
    title: 'Self-Rescuer Equipment',
    description:
      'Every person entering a mine shall carry an approved self-rescuer. Self-rescuers shall be inspected and tested quarterly.',
    category: 'PPE',
    checkType: 'manual',
    frequency: 'quarterly',
  },
  {
    id: 'DGMS-06',
    standard: 'DGMS',
    clause: 'MMR 2017 S.18',
    title: 'Ground Control Management',
    description:
      'A systematic ground control management plan shall be implemented with regular geotechnical assessments and monitoring.',
    category: 'Structural Integrity',
    checkType: 'manual',
    frequency: 'monthly',
  },
  {
    id: 'DGMS-07',
    standard: 'DGMS',
    clause: 'CMR Reg 29',
    title: 'Safety Training and Induction',
    description:
      'No person shall be employed underground without initial safety training (min 5 days) and refresher training annually.',
    category: 'Training',
    checkType: 'documentation',
    frequency: 'annual',
  },
  {
    id: 'DGMS-08',
    standard: 'DGMS',
    clause: 'MMR 2017 S.24',
    title: 'PPE Compliance Monitoring',
    description:
      'All personnel in operational areas shall wear prescribed PPE including hard hat, safety shoes, hi-vis vest, and task-specific protection.',
    category: 'PPE',
    checkType: 'automated',
    frequency: 'daily',
  },
];

// ===========================================================================
// 1. getComplianceRequirements
// ===========================================================================

/**
 * Returns the full list of 30+ regulatory requirements with simulated
 * compliance statuses, scores, and deviations.
 */
export function getComplianceRequirements(): ComplianceRequirement[] {
  return REQUIREMENT_DEFINITIONS.map((def) => {
    const status = seededStatus(def.id);
    const score = seededScore(def.id, status);
    const deviations = seededDeviations(def.id, status, def.title);

    // Simulate last checked date based on frequency
    let lastCheckedDaysAgo: number;
    switch (def.frequency) {
      case 'daily':
        lastCheckedDaysAgo = randomBetween(0, 1);
        break;
      case 'weekly':
        lastCheckedDaysAgo = randomBetween(0, 7);
        break;
      case 'monthly':
        lastCheckedDaysAgo = randomBetween(0, 30);
        break;
      case 'quarterly':
        lastCheckedDaysAgo = randomBetween(0, 90);
        break;
      case 'annual':
        lastCheckedDaysAgo = randomBetween(0, 365);
        break;
    }

    return {
      id: def.id,
      standard: def.standard,
      clause: def.clause,
      title: def.title,
      description: def.description,
      category: def.category,
      checkType: def.checkType,
      frequency: def.frequency,
      lastChecked: daysAgo(lastCheckedDaysAgo),
      status,
      score,
      deviations,
    };
  });
}

// ===========================================================================
// 2. auditCompliance
// ===========================================================================

/**
 * Run a full compliance audit against all requirements.
 *
 * @returns Aggregated audit result with scores by standard and category.
 */
export function auditCompliance(): ComplianceAuditResult {
  const requirements = getComplianceRequirements();

  const byStandard: Record<string, { total: number; sum: number }> = {};
  const byCategory: Record<string, { total: number; sum: number }> = {};

  let compliant = 0;
  let nonCompliant = 0;
  let partial = 0;

  for (const req of requirements) {
    // Count statuses
    switch (req.status) {
      case 'compliant':
        compliant += 1;
        break;
      case 'non-compliant':
        nonCompliant += 1;
        break;
      case 'partial':
        partial += 1;
        break;
    }

    // Accumulate by standard
    if (!byStandard[req.standard]) {
      byStandard[req.standard] = { total: 0, sum: 0 };
    }
    byStandard[req.standard].total += 1;
    byStandard[req.standard].sum += req.score;

    // Accumulate by category
    if (!byCategory[req.category]) {
      byCategory[req.category] = { total: 0, sum: 0 };
    }
    byCategory[req.category].total += 1;
    byCategory[req.category].sum += req.score;
  }

  // Calculate averages
  const standardScores: Record<string, number> = {};
  for (const [key, val] of Object.entries(byStandard)) {
    standardScores[key] = Math.round(val.sum / val.total);
  }

  const categoryScores: Record<string, number> = {};
  for (const [key, val] of Object.entries(byCategory)) {
    categoryScores[key] = Math.round(val.sum / val.total);
  }

  const overallScore = Math.round(
    requirements.reduce((sum, r) => sum + r.score, 0) / requirements.length,
  );

  return {
    overallScore,
    byStandard: standardScores,
    byCategory: categoryScores,
    totalRequirements: requirements.length,
    compliant,
    nonCompliant,
    partial,
  };
}

// ===========================================================================
// 3. generateCorrectiveActions
// ===========================================================================

/**
 * Generate corrective action plans for given deviations.
 */
export function generateCorrectiveActions(deviations: string[]): CorrectiveAction[] {
  const correctionMap: Record<string, { action: string; priority: 'high' | 'medium' | 'low' }> = {
    documentation: {
      action: 'Update and submit revised documentation to the Safety Officer within 7 days. Ensure all records are digitized in the CMMS.',
      priority: 'medium',
    },
    training: {
      action: 'Schedule makeup safety training sessions within 14 days. Maintain attendance records with digital signatures.',
      priority: 'high',
    },
    calibration: {
      action: 'Immediately schedule re-calibration of all overdue instruments. Engage approved calibration agency within 48 hours.',
      priority: 'high',
    },
    inspection: {
      action: 'Complete overdue inspection and submit signed report to competent authority within 5 working days.',
      priority: 'high',
    },
    drill: {
      action: 'Schedule and conduct emergency drill within 15 days. Document lessons learned and update emergency plan.',
      priority: 'medium',
    },
    inventory: {
      action: 'Procure replacement PPE items within 72 hours. Update inventory register and establish reorder thresholds.',
      priority: 'medium',
    },
    signage: {
      action: 'Replace all faded or missing safety signage within 48 hours. Conduct site walk-through to verify placement.',
      priority: 'low',
    },
    permit: {
      action: 'Digitize permit register and enforce electronic permit-to-work system. Train all supervisors within 14 days.',
      priority: 'medium',
    },
    extinguisher: {
      action: 'Immediately service or replace overdue fire extinguishers. Engage certified service provider within 24 hours.',
      priority: 'high',
    },
    earthing: {
      action: 'Conduct earthing resistance testing on all flagged circuits within 72 hours. Replace failing earth connections.',
      priority: 'high',
    },
  };

  return deviations.map((deviation) => {
    const lowerDev = deviation.toLowerCase();

    let matched = correctionMap.documentation; // default
    for (const [keyword, correction] of Object.entries(correctionMap)) {
      if (lowerDev.includes(keyword)) {
        matched = correction;
        break;
      }
    }

    // Try to match more keywords
    if (lowerDev.includes('training') || lowerDev.includes('personnel')) {
      matched = correctionMap.training;
    } else if (lowerDev.includes('calibration') || lowerDev.includes('overdue')) {
      matched = correctionMap.calibration;
    } else if (lowerDev.includes('inspection') || lowerDev.includes('signed')) {
      matched = correctionMap.inspection;
    } else if (lowerDev.includes('drill') || lowerDev.includes('emergency')) {
      matched = correctionMap.drill;
    } else if (lowerDev.includes('ppe') || lowerDev.includes('inventory') || lowerDev.includes('stock')) {
      matched = correctionMap.inventory;
    } else if (lowerDev.includes('signage') || lowerDev.includes('faded')) {
      matched = correctionMap.signage;
    } else if (lowerDev.includes('permit') || lowerDev.includes('register')) {
      matched = correctionMap.permit;
    } else if (lowerDev.includes('extinguisher') || lowerDev.includes('fire')) {
      matched = correctionMap.extinguisher;
    } else if (lowerDev.includes('earthing') || lowerDev.includes('electrical') || lowerDev.includes('resistance')) {
      matched = correctionMap.earthing;
    }

    const deadlineDays = matched.priority === 'high' ? 7 : matched.priority === 'medium' ? 14 : 30;

    const assignees = [
      'Safety Officer - R. Sharma',
      'Maintenance Head - P. Kumar',
      'Shift Supervisor - A. Singh',
      'HSE Manager - V. Patel',
      'Electrical Engineer - S. Gupta',
      'Fire Officer - M. Reddy',
    ];

    return {
      id: nextCorrectiveActionId(),
      requirementId: '',
      deviation,
      action: matched.action,
      priority: matched.priority,
      deadline: daysFromNow(deadlineDays),
      assignedTo: assignees[Math.floor(Math.random() * assignees.length)],
      status: 'open' as const,
    };
  });
}

// ===========================================================================
// 4. getUpcomingInspections
// ===========================================================================

/**
 * Generate the next 10 scheduled inspections based on requirement frequencies.
 */
export function getUpcomingInspections(): ScheduledInspection[] {
  const requirements = getComplianceRequirements();

  const inspectors = [
    'Dr. R. Krishnamurthy (Chief Inspector)',
    'S. Venkataraman (OISD Auditor)',
    'P. Bhattacharya (DGMS Inspector)',
    'A. Deshmukh (Factory Inspector)',
    'K. Raghunath (Fire Safety Officer)',
    'M. Anand (Electrical Inspector)',
    'V. Subramanian (Environmental Officer)',
    'R. Kapoor (Safety Auditor)',
    'J. Chowdhury (PESO Inspector)',
    'N. Iyengar (Boiler Inspector)',
  ];

  const zones = [
    'Zone A — CDU/VDU Process',
    'Zone B — Tank Farm',
    'Zone C — Utilities',
    'Zone D — Catalyst Storage',
    'Zone E — Loading Gantry',
    'Zone F — Control Room',
    'Zone G — Workshop/Maintenance',
    'Zone H — Admin & Safety',
  ];

  const inspections: ScheduledInspection[] = requirements
    .filter((r) => r.checkType === 'manual' || r.checkType === 'documentation')
    .map((req, index) => {
      let daysUntilNext: number;
      switch (req.frequency) {
        case 'daily':
          daysUntilNext = 1;
          break;
        case 'weekly':
          daysUntilNext = randomBetween(1, 7);
          break;
        case 'monthly':
          daysUntilNext = randomBetween(1, 30);
          break;
        case 'quarterly':
          daysUntilNext = randomBetween(1, 90);
          break;
        case 'annual':
          daysUntilNext = randomBetween(30, 365);
          break;
      }

      return {
        id: nextInspectionId(),
        requirementId: req.id,
        title: `${req.standard} — ${req.title}`,
        standard: req.standard,
        date: daysFromNow(daysUntilNext),
        inspector: inspectors[index % inspectors.length],
        zone: zones[index % zones.length],
        status: 'scheduled' as const,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  return inspections;
}

// ===========================================================================
// 5. getComplianceTrend
// ===========================================================================

/**
 * Generate monthly compliance trend data for the past 12 months.
 * Simulates a realistic trajectory with gradual improvement and
 * occasional dips from audit findings.
 */
export function getComplianceTrend(): ComplianceTrendPoint[] {
  const now = new Date();
  const totalReqs = REQUIREMENT_DEFINITIONS.length;
  const trend: ComplianceTrendPoint[] = [];

  // Baseline: start lower 12 months ago and trend upward with noise
  let baseScore = 62;

  for (let i = 11; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

    // Gradual improvement with periodic dips
    const improvement = (11 - i) * 1.8;
    const noise = Math.sin(i * 1.5) * 5;
    const score = Math.min(
      98,
      Math.max(50, Math.round(baseScore + improvement + noise)),
    );

    // Derive compliant/non-compliant counts from score
    const compliantCount = Math.round((score / 100) * totalReqs);
    const remaining = totalReqs - compliantCount;
    const nonCompliantCount = Math.round(remaining * 0.4);
    const partialCount = remaining - nonCompliantCount;

    trend.push({
      month,
      score,
      compliant: compliantCount,
      nonCompliant: nonCompliantCount,
      partial: partialCount,
    });
  }

  return trend;
}
