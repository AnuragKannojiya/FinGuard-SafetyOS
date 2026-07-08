// =============================================================================
// FinGuard SafetyOS — Pattern Intelligence Engine
// =============================================================================
// Analyzes historical incident data to detect temporal patterns, root-cause
// clusters, shift risk profiles, and predict future high-risk periods.
// All outputs are formatted for direct consumption by Recharts components.
// =============================================================================

import type {
  Incident,
  ShiftType,
  TemporalPattern,
  RootCauseCluster,
  ShiftRiskProfile,
  HighRiskPeriod,
  PreventionPriority,
  IncidentTrendPoint,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

function getHour(dateStr: string): number {
  return parseDate(dateStr).getHours();
}

function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

function getMonth(dateStr: string): number {
  return parseDate(dateStr).getMonth();
}

function getShiftFromHour(hour: number): ShiftType {
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'evening';
  return 'night';
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const HOUR_LABELS = [
  '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM',
  '6 AM', '7 AM', '8 AM', '9 AM', '10 AM', '11 AM',
  '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
  '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM',
];

function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function severityCategory(severity: number): 'critical' | 'major' | 'minor' | 'nearMiss' {
  if (severity >= 8) return 'critical';
  if (severity >= 5) return 'major';
  if (severity >= 3) return 'minor';
  return 'nearMiss';
}

// ===========================================================================
// 1. analyzeTemporalPatterns
// ===========================================================================

/**
 * Analyze time-of-day, day-of-week, and monthly incident patterns.
 *
 * @returns Object with three arrays: `byHour`, `byDay`, `byMonth`,
 * each containing `{ label, count, severity }` suitable for Recharts.
 */
export function analyzeTemporalPatterns(incidents: Incident[]): {
  byHour: TemporalPattern[];
  byDay: TemporalPattern[];
  byMonth: TemporalPattern[];
} {
  // ----- By Hour -----
  const hourBuckets: Map<number, { count: number; severities: number[] }> = new Map();
  for (let h = 0; h < 24; h++) {
    hourBuckets.set(h, { count: 0, severities: [] });
  }
  for (const inc of incidents) {
    const h = getHour(inc.date);
    const bucket = hourBuckets.get(h)!;
    bucket.count += 1;
    bucket.severities.push(inc.severity);
  }
  const byHour: TemporalPattern[] = Array.from(hourBuckets.entries()).map(
    ([hour, data]) => ({
      label: HOUR_LABELS[hour],
      count: data.count,
      severity: Math.round(average(data.severities) * 10) / 10,
    }),
  );

  // ----- By Day of Week -----
  const dayBuckets: Map<number, { count: number; severities: number[] }> = new Map();
  for (let d = 0; d < 7; d++) {
    dayBuckets.set(d, { count: 0, severities: [] });
  }
  for (const inc of incidents) {
    const d = getDayOfWeek(inc.date);
    const bucket = dayBuckets.get(d)!;
    bucket.count += 1;
    bucket.severities.push(inc.severity);
  }
  const byDay: TemporalPattern[] = Array.from(dayBuckets.entries()).map(
    ([day, data]) => ({
      label: DAY_NAMES[day],
      count: data.count,
      severity: Math.round(average(data.severities) * 10) / 10,
    }),
  );

  // ----- By Month -----
  const monthBuckets: Map<number, { count: number; severities: number[] }> = new Map();
  for (let m = 0; m < 12; m++) {
    monthBuckets.set(m, { count: 0, severities: [] });
  }
  for (const inc of incidents) {
    const m = getMonth(inc.date);
    const bucket = monthBuckets.get(m)!;
    bucket.count += 1;
    bucket.severities.push(inc.severity);
  }
  const byMonth: TemporalPattern[] = Array.from(monthBuckets.entries()).map(
    ([month, data]) => ({
      label: MONTH_NAMES[month],
      count: data.count,
      severity: Math.round(average(data.severities) * 10) / 10,
    }),
  );

  return { byHour, byDay, byMonth };
}

// ===========================================================================
// 2. analyzeRootCauseClusters
// ===========================================================================

/**
 * Group incidents by root cause and compute cluster statistics.
 *
 * @returns Array of `{ cause, count, severity, percentage }` sorted by
 * descending count.
 */
export function analyzeRootCauseClusters(incidents: Incident[]): RootCauseCluster[] {
  if (incidents.length === 0) return [];

  const clusters: Map<string, { count: number; severities: number[] }> = new Map();

  for (const inc of incidents) {
    const cause = inc.rootCause || 'Unknown';
    const existing = clusters.get(cause) ?? { count: 0, severities: [] };
    existing.count += 1;
    existing.severities.push(inc.severity);
    clusters.set(cause, existing);
  }

  const total = incidents.length;

  return Array.from(clusters.entries())
    .map(([cause, data]) => ({
      cause,
      count: data.count,
      severity: Math.round(average(data.severities) * 10) / 10,
      percentage: Math.round((data.count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

// ===========================================================================
// 3. calculateShiftRiskProfile
// ===========================================================================

/**
 * Calculate a composite risk score for each shift type based on incident
 * frequency and severity.
 */
export function calculateShiftRiskProfile(incidents: Incident[]): ShiftRiskProfile[] {
  const shiftData: Record<ShiftType, { count: number; severities: number[] }> = {
    morning: { count: 0, severities: [] },
    evening: { count: 0, severities: [] },
    night: { count: 0, severities: [] },
  };

  for (const inc of incidents) {
    const hour = getHour(inc.date);
    const shift = getShiftFromHour(hour);
    shiftData[shift].count += 1;
    shiftData[shift].severities.push(inc.severity);
  }

  const maxCount = Math.max(
    1,
    shiftData.morning.count,
    shiftData.evening.count,
    shiftData.night.count,
  );

  const profiles: ShiftRiskProfile[] = (['morning', 'evening', 'night'] as ShiftType[]).map(
    (shift) => {
      const data = shiftData[shift];
      const avgSeverity = average(data.severities);
      // Risk score: weighted combination of frequency (normalized) + avg severity
      const frequencyScore = (data.count / maxCount) * 50;
      const severityScore = (avgSeverity / 10) * 50;
      const riskScore = Math.round((frequencyScore + severityScore) * 10) / 10;

      return {
        shift,
        riskScore,
        incidentCount: data.count,
        averageSeverity: Math.round(avgSeverity * 10) / 10,
      };
    },
  );

  return profiles.sort((a, b) => b.riskScore - a.riskScore);
}

// ===========================================================================
// 4. predictHighRiskPeriods
// ===========================================================================

/**
 * Predict upcoming high-risk periods based on historical incident patterns.
 *
 * Examines day-of-week and monthly patterns to identify windows where
 * incidents are statistically more likely.
 */
export function predictHighRiskPeriods(
  incidents: Incident[],
  currentDate: Date = new Date(),
): HighRiskPeriod[] {
  const { byDay, byMonth } = analyzeTemporalPatterns(incidents);
  const shiftProfiles = calculateShiftRiskProfile(incidents);

  const predictions: HighRiskPeriod[] = [];
  const avgDayCount = average(byDay.map((d) => d.count));
  const avgMonthCount = average(byMonth.map((m) => m.count));

  // Look ahead 30 days
  for (let daysAhead = 0; daysAhead < 30; daysAhead++) {
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const dayIndex = targetDate.getDay();
    const monthIndex = targetDate.getMonth();

    const dayPattern = byDay[dayIndex];
    const monthPattern = byMonth[monthIndex];

    // A day is high-risk if its day-of-week count > 1.5× average
    // AND its month count > average
    const dayRiskMultiplier = avgDayCount > 0 ? dayPattern.count / avgDayCount : 1;
    const monthRiskMultiplier = avgMonthCount > 0 ? monthPattern.count / avgMonthCount : 1;

    if (dayRiskMultiplier > 1.3 || monthRiskMultiplier > 1.3) {
      const combinedRisk = Math.round(
        ((dayRiskMultiplier * 40 + monthRiskMultiplier * 30) / 70) * 100,
      );

      // Determine the highest-risk shift for this day
      const peakShift = shiftProfiles[0];

      const reasons: string[] = [];
      if (dayRiskMultiplier > 1.3) {
        reasons.push(
          `${dayPattern.label}s have ${dayPattern.count} historical incidents (${Math.round(dayRiskMultiplier * 100)}% of average)`,
        );
      }
      if (monthRiskMultiplier > 1.3) {
        reasons.push(
          `${monthPattern.label} has ${monthPattern.count} historical incidents (${Math.round(monthRiskMultiplier * 100)}% of average)`,
        );
      }
      reasons.push(
        `Peak risk during ${peakShift.shift} shift (risk score: ${peakShift.riskScore})`,
      );

      const dateStr = targetDate.toISOString().split('T')[0];

      predictions.push({
        startDate: dateStr,
        endDate: dateStr,
        riskScore: Math.min(combinedRisk, 100),
        reason: reasons.join('; '),
        historicalIncidents: dayPattern.count + monthPattern.count,
      });
    }
  }

  return predictions
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 15);
}

// ===========================================================================
// 5. generatePreventionPriorities
// ===========================================================================

/**
 * Generate ranked prevention actions based on incident data analysis.
 * Each action includes estimated lives saved and injuries prevented.
 */
export function generatePreventionPriorities(incidents: Incident[]): PreventionPriority[] {
  const rootCauses = analyzeRootCauseClusters(incidents);
  const totalFatalities = incidents.reduce((s, i) => s + i.fatalities, 0);
  const totalInjuries = incidents.reduce((s, i) => s + i.injuries, 0);

  // Map root causes to prevention actions
  const preventionMap: Record<
    string,
    { action: string; category: string; cost: 'low' | 'medium' | 'high'; time: string }
  > = {
    'Equipment failure': {
      action: 'Implement predictive maintenance with vibration and thermal monitoring on all critical rotating equipment',
      category: 'Equipment Inspection',
      cost: 'high',
      time: '6 months',
    },
    'Human error': {
      action: 'Deploy AI-assisted task verification system with real-time procedure compliance monitoring',
      category: 'Training',
      cost: 'medium',
      time: '3 months',
    },
    'Procedure violation': {
      action: 'Implement mandatory digital permit verification with biometric confirmation at zone entry points',
      category: 'Permit-to-Work',
      cost: 'medium',
      time: '4 months',
    },
    'Inadequate maintenance': {
      action: 'Establish condition-based maintenance program with automated inspection scheduling and parts inventory',
      category: 'Equipment Inspection',
      cost: 'high',
      time: '8 months',
    },
    'Communication failure': {
      action: 'Deploy zone-based digital communication boards with automated shift-handover briefing system',
      category: 'Emergency Preparedness',
      cost: 'low',
      time: '2 months',
    },
    'Design deficiency': {
      action: 'Conduct HAZOP review of all process systems with focus on inherent safety design improvements',
      category: 'Structural Integrity',
      cost: 'high',
      time: '12 months',
    },
    'Corrosion': {
      action: 'Implement risk-based inspection (RBI) program with ultrasonic thickness monitoring on all piping',
      category: 'Equipment Inspection',
      cost: 'medium',
      time: '6 months',
    },
    'Operator fatigue': {
      action: 'Deploy fatigue monitoring wearables and enforce mandatory rest periods with automated shift-length tracking',
      category: 'Training',
      cost: 'medium',
      time: '2 months',
    },
    'Inadequate training': {
      action: 'Implement VR-based emergency response training with quarterly competency assessments',
      category: 'Training',
      cost: 'medium',
      time: '3 months',
    },
    'Weather conditions': {
      action: 'Install automated weather monitoring with work-activity suspension protocols for extreme conditions',
      category: 'Environmental',
      cost: 'low',
      time: '1 month',
    },
    'Gas leak': {
      action: 'Upgrade gas detection network with AI-driven leak prediction and automated isolation valve control',
      category: 'Gas Detection',
      cost: 'high',
      time: '6 months',
    },
    'Electrical fault': {
      action: 'Install continuous insulation monitoring and arc flash detection on all HV/MV switchgear',
      category: 'Electrical Safety',
      cost: 'high',
      time: '8 months',
    },
    'PPE non-compliance': {
      action: 'Deploy AI-powered CCTV PPE detection system with real-time alerts and zone access control integration',
      category: 'PPE',
      cost: 'medium',
      time: '3 months',
    },
    'Fire': {
      action: 'Upgrade fire detection system with multi-spectrum IR/UV flame detectors and automated deluge activation',
      category: 'Fire Safety',
      cost: 'high',
      time: '6 months',
    },
    'Structural failure': {
      action: 'Implement continuous structural health monitoring with strain gauges and accelerometers on critical structures',
      category: 'Structural Integrity',
      cost: 'high',
      time: '10 months',
    },
  };

  // Default prevention for unknown causes
  const defaultPrevention = {
    action: 'Conduct comprehensive root-cause analysis and implement targeted corrective action plan',
    category: 'Emergency Preparedness',
    cost: 'medium' as const,
    time: '3 months',
  };

  const priorities: PreventionPriority[] = rootCauses.map((cluster, index) => {
    const prevention = preventionMap[cluster.cause] ?? defaultPrevention;

    // Estimate impact proportional to this cause's share of total incidents
    const proportion = cluster.count / Math.max(incidents.length, 1);
    const estLivesSaved = Math.round(totalFatalities * proportion * 10) / 10;
    const estInjuriesPrevented = Math.round(totalInjuries * proportion * 10) / 10;

    return {
      rank: index + 1,
      action: prevention.action,
      category: prevention.category,
      estimatedLivesSaved: estLivesSaved,
      estimatedInjuriesPrevented: estInjuriesPrevented,
      implementationCost: prevention.cost,
      timeToImplement: prevention.time,
    };
  });

  // Re-sort by estimated lives saved (descending), then injuries prevented
  return priorities
    .sort((a, b) => {
      const lifeDiff = b.estimatedLivesSaved - a.estimatedLivesSaved;
      if (Math.abs(lifeDiff) > 0.001) return lifeDiff;
      return b.estimatedInjuriesPrevented - a.estimatedInjuriesPrevented;
    })
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

// ===========================================================================
// 6. getIncidentTrends
// ===========================================================================

/**
 * Aggregate incident data by month for trend charts.
 *
 * @returns Array of `{ month, total, critical, major, minor, nearMiss }`
 * sorted chronologically.
 */
export function getIncidentTrends(incidents: Incident[]): IncidentTrendPoint[] {
  if (incidents.length === 0) return [];

  // Determine date range
  const dates = incidents.map((i) => parseDate(i.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));

  // Create month buckets
  const buckets: Map<
    string,
    { total: number; critical: number; major: number; minor: number; nearMiss: number }
  > = new Map();

  const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const end = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 1);

  while (cursor < end) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, { total: 0, critical: 0, major: 0, minor: 0, nearMiss: 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Fill buckets
  for (const inc of incidents) {
    const d = parseDate(inc.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;

    bucket.total += 1;
    const cat = severityCategory(inc.severity);
    bucket[cat] += 1;
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      total: data.total,
      critical: data.critical,
      major: data.major,
      minor: data.minor,
      nearMiss: data.nearMiss,
    }));
}
