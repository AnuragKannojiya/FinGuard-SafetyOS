'use client';

import { useEffect, useRef, createContext, useContext, useState, type ReactNode } from 'react';
import { useSafetyStore } from '@/stores/safety-store';
import type { SensorReading, Worker, Permit, ProcessUnit, Zone, Alert, ShiftType } from '@/stores/safety-store';

// ── Plant Configuration (inline for self-containment) ──

const ZONE_DEFS: Zone[] = [
  { id: 'coke-oven', name: 'Coke Oven Battery', type: 'process', position: { x: 10, y: 8 }, size: { width: 18, height: 22 }, hazardLevel: 5, maxOccupancy: 30, riskScore: 0, description: 'Coal carbonization producing coke for blast furnace' },
  { id: 'blast-furnace', name: 'Blast Furnace Area', type: 'process', position: { x: 30, y: 5 }, size: { width: 20, height: 25 }, hazardLevel: 5, maxOccupancy: 25, riskScore: 0, description: 'Iron ore smelting at 1500°C+' },
  { id: 'sms', name: 'Steel Melting Shop', type: 'process', position: { x: 52, y: 8 }, size: { width: 22, height: 20 }, hazardLevel: 5, maxOccupancy: 35, riskScore: 0, description: 'BOF converter and continuous casting' },
  { id: 'rolling-mill', name: 'Rolling Mill', type: 'process', position: { x: 76, y: 10 }, size: { width: 18, height: 18 }, hazardLevel: 3, maxOccupancy: 40, riskScore: 0, description: 'Hot and cold rolling of steel products' },
  { id: 'gas-recovery', name: 'Gas Recovery Plant', type: 'process', position: { x: 10, y: 35 }, size: { width: 16, height: 18 }, hazardLevel: 5, maxOccupancy: 15, riskScore: 0, description: 'Coke oven gas and BF gas recovery' },
  { id: 'water-treatment', name: 'Water Treatment', type: 'utility', position: { x: 28, y: 35 }, size: { width: 14, height: 16 }, hazardLevel: 2, maxOccupancy: 10, riskScore: 0, description: 'Industrial water treatment and recycling' },
  { id: 'raw-material', name: 'Raw Material Yard', type: 'utility', position: { x: 44, y: 33 }, size: { width: 16, height: 18 }, hazardLevel: 2, maxOccupancy: 20, riskScore: 0, description: 'Iron ore, coal, and flux storage' },
  { id: 'power-plant', name: 'Power Plant', type: 'utility', position: { x: 62, y: 32 }, size: { width: 16, height: 16 }, hazardLevel: 4, maxOccupancy: 15, riskScore: 0, description: 'Captive power generation' },
  { id: 'oxygen-plant', name: 'Oxygen Plant', type: 'utility', position: { x: 80, y: 32 }, size: { width: 14, height: 16 }, hazardLevel: 4, maxOccupancy: 10, riskScore: 0, description: 'Oxygen and nitrogen gas production' },
  { id: 'hazwaste', name: 'Hazardous Waste Storage', type: 'utility', position: { x: 10, y: 58 }, size: { width: 14, height: 14 }, hazardLevel: 4, maxOccupancy: 8, riskScore: 0, description: 'Hazardous waste containment' },
  { id: 'control-room', name: 'Central Control Room', type: 'admin', position: { x: 28, y: 56 }, size: { width: 14, height: 14 }, hazardLevel: 1, maxOccupancy: 20, riskScore: 0, description: 'SCADA and process control center' },
  { id: 'workshop', name: 'Workshop / Maintenance', type: 'utility', position: { x: 44, y: 56 }, size: { width: 16, height: 14 }, hazardLevel: 3, maxOccupancy: 25, riskScore: 0, description: 'Equipment repair and fabrication' },
  { id: 'admin', name: 'Admin Block', type: 'admin', position: { x: 62, y: 54 }, size: { width: 14, height: 14 }, hazardLevel: 1, maxOccupancy: 50, riskScore: 0, description: 'Administrative offices' },
  { id: 'fire-station', name: 'Fire Station', type: 'safety', position: { x: 78, y: 54 }, size: { width: 14, height: 14 }, hazardLevel: 1, maxOccupancy: 15, riskScore: 0, description: 'Fire brigade and emergency response' },
  { id: 'main-gate', name: 'Main Gate / Security', type: 'safety', position: { x: 44, y: 76 }, size: { width: 12, height: 10 }, hazardLevel: 1, maxOccupancy: 10, riskScore: 0, description: 'Entry/exit checkpoint' },
];

interface SensorDef {
  id: string;
  zoneId: string;
  type: string;
  unit: string;
  normalRange: { min: number; max: number };
  warningThreshold: number;
  criticalThreshold: number;
}

const SENSOR_DEFS: SensorDef[] = [
  // Coke Oven sensors
  { id: 'CKO-CH4-01', zoneId: 'coke-oven', type: 'CH4', unit: '% LEL', normalRange: { min: 0, max: 15 }, warningThreshold: 25, criticalThreshold: 50 },
  { id: 'CKO-CO-01', zoneId: 'coke-oven', type: 'CO', unit: 'ppm', normalRange: { min: 0, max: 25 }, warningThreshold: 35, criticalThreshold: 50 },
  { id: 'CKO-H2S-01', zoneId: 'coke-oven', type: 'H2S', unit: 'ppm', normalRange: { min: 0, max: 5 }, warningThreshold: 10, criticalThreshold: 20 },
  { id: 'CKO-TEMP-01', zoneId: 'coke-oven', type: 'Temperature', unit: '°C', normalRange: { min: 30, max: 55 }, warningThreshold: 65, criticalThreshold: 80 },
  { id: 'CKO-PRESS-01', zoneId: 'coke-oven', type: 'Pressure', unit: 'kPa', normalRange: { min: 98, max: 105 }, warningThreshold: 110, criticalThreshold: 120 },
  // Blast Furnace sensors
  { id: 'BF-CH4-01', zoneId: 'blast-furnace', type: 'CH4', unit: '% LEL', normalRange: { min: 0, max: 10 }, warningThreshold: 20, criticalThreshold: 40 },
  { id: 'BF-CO-01', zoneId: 'blast-furnace', type: 'CO', unit: 'ppm', normalRange: { min: 0, max: 30 }, warningThreshold: 50, criticalThreshold: 100 },
  { id: 'BF-TEMP-01', zoneId: 'blast-furnace', type: 'Temperature', unit: '°C', normalRange: { min: 50, max: 85 }, warningThreshold: 95, criticalThreshold: 120 },
  { id: 'BF-PRESS-01', zoneId: 'blast-furnace', type: 'Pressure', unit: 'kPa', normalRange: { min: 180, max: 250 }, warningThreshold: 280, criticalThreshold: 320 },
  { id: 'BF-VIB-01', zoneId: 'blast-furnace', type: 'Vibration', unit: 'mm/s', normalRange: { min: 0, max: 4 }, warningThreshold: 7, criticalThreshold: 11 },
  // SMS sensors
  { id: 'SMS-CO-01', zoneId: 'sms', type: 'CO', unit: 'ppm', normalRange: { min: 0, max: 20 }, warningThreshold: 35, criticalThreshold: 50 },
  { id: 'SMS-TEMP-01', zoneId: 'sms', type: 'Temperature', unit: '°C', normalRange: { min: 35, max: 65 }, warningThreshold: 80, criticalThreshold: 100 },
  { id: 'SMS-O2-01', zoneId: 'sms', type: 'O2', unit: '%', normalRange: { min: 19.5, max: 23.5 }, warningThreshold: 18, criticalThreshold: 16 },
  { id: 'SMS-PRESS-01', zoneId: 'sms', type: 'Pressure', unit: 'kPa', normalRange: { min: 95, max: 108 }, warningThreshold: 115, criticalThreshold: 125 },
  // Rolling Mill sensors
  { id: 'RM-TEMP-01', zoneId: 'rolling-mill', type: 'Temperature', unit: '°C', normalRange: { min: 25, max: 45 }, warningThreshold: 55, criticalThreshold: 70 },
  { id: 'RM-VIB-01', zoneId: 'rolling-mill', type: 'Vibration', unit: 'mm/s', normalRange: { min: 0, max: 5 }, warningThreshold: 8, criticalThreshold: 12 },
  { id: 'RM-NOISE-01', zoneId: 'rolling-mill', type: 'Noise', unit: 'dB', normalRange: { min: 70, max: 85 }, warningThreshold: 90, criticalThreshold: 100 },
  // Gas Recovery sensors
  { id: 'GR-CH4-01', zoneId: 'gas-recovery', type: 'CH4', unit: '% LEL', normalRange: { min: 0, max: 10 }, warningThreshold: 20, criticalThreshold: 40 },
  { id: 'GR-H2S-01', zoneId: 'gas-recovery', type: 'H2S', unit: 'ppm', normalRange: { min: 0, max: 3 }, warningThreshold: 8, criticalThreshold: 15 },
  { id: 'GR-CO-01', zoneId: 'gas-recovery', type: 'CO', unit: 'ppm', normalRange: { min: 0, max: 20 }, warningThreshold: 40, criticalThreshold: 80 },
  { id: 'GR-PRESS-01', zoneId: 'gas-recovery', type: 'Pressure', unit: 'kPa', normalRange: { min: 50, max: 80 }, warningThreshold: 95, criticalThreshold: 110 },
  { id: 'GR-FLOW-01', zoneId: 'gas-recovery', type: 'Flow Rate', unit: 'm³/h', normalRange: { min: 800, max: 1200 }, warningThreshold: 1400, criticalThreshold: 1600 },
  // Power Plant sensors
  { id: 'PP-TEMP-01', zoneId: 'power-plant', type: 'Temperature', unit: '°C', normalRange: { min: 40, max: 70 }, warningThreshold: 85, criticalThreshold: 100 },
  { id: 'PP-VIB-01', zoneId: 'power-plant', type: 'Vibration', unit: 'mm/s', normalRange: { min: 0, max: 3 }, warningThreshold: 6, criticalThreshold: 10 },
  // Oxygen Plant sensors
  { id: 'OX-O2-01', zoneId: 'oxygen-plant', type: 'O2', unit: '%', normalRange: { min: 20.5, max: 23.5 }, warningThreshold: 25, criticalThreshold: 28 },
  { id: 'OX-PRESS-01', zoneId: 'oxygen-plant', type: 'Pressure', unit: 'kPa', normalRange: { min: 200, max: 350 }, warningThreshold: 400, criticalThreshold: 450 },
  { id: 'OX-TEMP-01', zoneId: 'oxygen-plant', type: 'Temperature', unit: '°C', normalRange: { min: -10, max: 20 }, warningThreshold: 30, criticalThreshold: 45 },
  // Hazwaste sensors
  { id: 'HW-CH4-01', zoneId: 'hazwaste', type: 'CH4', unit: '% LEL', normalRange: { min: 0, max: 5 }, warningThreshold: 15, criticalThreshold: 30 },
  { id: 'HW-TEMP-01', zoneId: 'hazwaste', type: 'Temperature', unit: '°C', normalRange: { min: 10, max: 35 }, warningThreshold: 45, criticalThreshold: 55 },
  { id: 'HW-HUM-01', zoneId: 'hazwaste', type: 'Humidity', unit: '%', normalRange: { min: 30, max: 65 }, warningThreshold: 80, criticalThreshold: 90 },
  // Workshop
  { id: 'WS-TEMP-01', zoneId: 'workshop', type: 'Temperature', unit: '°C', normalRange: { min: 20, max: 40 }, warningThreshold: 50, criticalThreshold: 60 },
  { id: 'WS-NOISE-01', zoneId: 'workshop', type: 'Noise', unit: 'dB', normalRange: { min: 60, max: 80 }, warningThreshold: 85, criticalThreshold: 95 },
];

// ── Sensor Reading Generator ──

const sensorState: Record<string, number> = {};

function generateSensorReading(sensor: SensorDef, tick: number): SensorReading {
  const prev = sensorState[sensor.id] ?? (sensor.normalRange.min + sensor.normalRange.max) / 2;
  const range = sensor.normalRange.max - sensor.normalRange.min;
  
  // Brownian motion with mean reversion
  const meanReversion = 0.05 * ((sensor.normalRange.min + sensor.normalRange.max) / 2 - prev);
  const noise = (Math.random() - 0.5) * range * 0.08;
  const drift = Math.sin(tick * 0.001 + sensor.id.charCodeAt(3)) * range * 0.03;
  
  // Occasional spikes (2% chance)
  const spike = Math.random() < 0.02 ? (Math.random() - 0.3) * range * 0.5 : 0;
  
  let value = prev + meanReversion + noise + drift + spike;
  
  // Clamp to physical bounds
  const physicalMin = sensor.type === 'O2' ? 0 : sensor.normalRange.min - range * 0.3;
  const physicalMax = sensor.criticalThreshold * 1.3;
  value = Math.max(physicalMin, Math.min(physicalMax, value));
  
  // For O2, invert the threshold logic (low O2 is dangerous)
  let status: SensorReading['status'] = 'normal';
  if (sensor.type === 'O2') {
    if (value <= sensor.criticalThreshold) status = 'critical';
    else if (value <= sensor.warningThreshold) status = 'warning';
  } else {
    if (value >= sensor.criticalThreshold) status = 'critical';
    else if (value >= sensor.warningThreshold) status = 'warning';
  }
  
  // 0.5% chance of offline
  if (Math.random() < 0.005) status = 'offline';
  
  const trend: SensorReading['trend'] = value > prev + range * 0.01 ? 'rising' : value < prev - range * 0.01 ? 'falling' : 'stable';
  
  sensorState[sensor.id] = value;
  
  return {
    sensorId: sensor.id,
    value: Number(value.toFixed(2)),
    unit: sensor.unit,
    timestamp: Date.now(),
    status,
    trend,
    zoneId: sensor.zoneId,
    type: sensor.type,
  };
}

// ── Worker Generator ──

const FIRST_NAMES = ['Rajesh', 'Amit', 'Suresh', 'Vikram', 'Manoj', 'Arun', 'Sanjay', 'Deepak', 'Pradeep', 'Rakesh', 'Sunil', 'Ajay', 'Ramesh', 'Vijay', 'Ashok', 'Mukesh', 'Dinesh', 'Kamlesh', 'Neeraj', 'Pawan', 'Ravi', 'Gopal', 'Krishna', 'Mohan', 'Shyam', 'Bharat', 'Ganesh', 'Satish', 'Naresh', 'Yogesh', 'Harish', 'Girish', 'Nitin', 'Sachin', 'Hemant', 'Pramod', 'Santosh', 'Anand', 'Balaji', 'Chandra', 'Devendra', 'Firoz', 'Govind', 'Hari', 'Ishwar', 'Jagdish', 'Kiran', 'Lakshman', 'Mahesh', 'Om'];
const LAST_NAMES = ['Kumar', 'Singh', 'Sharma', 'Patel', 'Reddy', 'Rao', 'Das', 'Mishra', 'Gupta', 'Verma', 'Yadav', 'Joshi', 'Pandey', 'Chauhan', 'Nair', 'Mehta', 'Dubey', 'Thakur', 'Sahu', 'Prasad', 'Tiwari', 'Pillai', 'Iyer', 'Shukla', 'Patil'];
const ROLES: Worker['role'][] = ['operator', 'maintenance', 'safety-officer', 'supervisor', 'contractor', 'emergency-response'];
const SHIFTS: ShiftType[] = ['morning', 'evening', 'night'];
const CERTIFICATIONS = ['Confined Space Entry', 'Hot Work', 'Height Work', 'First Aid', 'Fire Fighting', 'Gas Testing', 'Electrical Safety', 'Crane Operation', 'Forklift'];

function generateAllWorkers(): Worker[] {
  const workers: Worker[] = [];
  for (let i = 0; i < 150; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const role = ROLES[i < 60 ? 0 : i < 90 ? 1 : i < 105 ? 3 : i < 120 ? 4 : i < 140 ? 2 : 5];
    const shift = SHIFTS[i % 3];
    const zoneIds = ZONE_DEFS.map(z => z.id);
    const zone = zoneIds[Math.floor(Math.random() * zoneIds.length)];
    const numCerts = 1 + Math.floor(Math.random() * 4);
    const certs = [...CERTIFICATIONS].sort(() => Math.random() - 0.5).slice(0, numCerts);
    
    workers.push({
      id: `WKR-${String(i + 1).padStart(3, '0')}`,
      name: `${fn} ${ln}`,
      role,
      shift,
      currentZone: zone,
      previousZone: zone,
      ppeCompliance: Math.random() > 0.05,
      status: 'active',
      entryTime: new Date(Date.now() - Math.random() * 3600000 * 4).toISOString(),
      certifications: certs,
    });
  }
  return workers;
}

function getActiveShift(): ShiftType {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 14) return 'morning';
  if (hour >= 14 && hour < 22) return 'evening';
  return 'night';
}

function updateWorkers(workers: Worker[]): Worker[] {
  const currentShift = getActiveShift();
  return workers.map(w => {
    const isOnShift = w.shift === currentShift;
    if (!isOnShift) return { ...w, status: 'break' as const };
    
    // 10% chance of zone change per tick
    if (Math.random() < 0.1) {
      const zones = ZONE_DEFS.map(z => z.id);
      const newZone = zones[Math.floor(Math.random() * zones.length)];
      return { ...w, previousZone: w.currentZone, currentZone: newZone, status: 'active' as const, ppeCompliance: Math.random() > 0.05 };
    }
    return { ...w, status: 'active' as const };
  });
}

// ── Permit Generator ──

const PERMIT_TEMPLATES: { type: Permit['type']; titles: string[] }[] = [
  { type: 'hot-work', titles: ['Welding repair on gas pipeline CKO-2', 'Cutting operation on BF-1 cooling pipe', 'Brazing work on SMS ductwork', 'Welding on rolling mill conveyor frame', 'Thermal cutting of worn caster segments'] },
  { type: 'cold-work', titles: ['Valve replacement on water treatment line', 'Bearing replacement on conveyor #7', 'Gasket replacement on gas holder', 'Instrument calibration - BF top gas analyzer', 'Pump impeller replacement - cooling tower'] },
  { type: 'confined-space', titles: ['Inspection of Coke Oven gas flue', 'Cleaning of BF dust catcher', 'Maintenance inside SMS ladle', 'Gas holder internal inspection', 'Water tank internal cleaning'] },
  { type: 'electrical-isolation', titles: ['Motor replacement on coke pushing machine', 'Cable tray repair in power plant', 'Transformer maintenance - 33kV substation', 'VFD replacement on oxygen compressor', 'Switchgear maintenance - SMS panel'] },
  { type: 'height-work', titles: ['Roof repair on rolling mill shed', 'Stack inspection - gas recovery chimney', 'Crane rail alignment - SMS bay', 'Lighting replacement - BF cast house', 'Structural inspection - conveyor gallery'] },
  { type: 'excavation', titles: ['Cable trench for new oxygen pipeline', 'Foundation work for auxiliary cooling', 'Drainage repair near raw material yard', 'Underground pipe leak repair', 'Earthwork for new fire hydrant line'] },
];

const PERMIT_REQUESTERS = ['Rajesh Kumar', 'Amit Singh', 'Suresh Sharma', 'Vikram Patel', 'Manoj Reddy', 'Arun Rao', 'Sanjay Das', 'Deepak Mishra'];
const PERMIT_APPROVERS = ['Chief Safety Officer R.K. Tiwari', 'Plant Manager S.N. Gupta', 'Zone Supervisor V.K. Singh', 'Safety Engineer P.L. Mehta'];

function generatePermits(): Permit[] {
  const permits: Permit[] = [];
  const count = 15 + Math.floor(Math.random() * 10);
  
  for (let i = 0; i < count; i++) {
    const template = PERMIT_TEMPLATES[Math.floor(Math.random() * PERMIT_TEMPLATES.length)];
    const title = template.titles[Math.floor(Math.random() * template.titles.length)];
    const zone = ZONE_DEFS.filter(z => z.type === 'process' || z.type === 'utility');
    const zoneId = zone[Math.floor(Math.random() * zone.length)].id;
    const statuses: Permit['status'][] = ['active', 'active', 'active', 'approved', 'draft', 'suspended'];
    const riskLevels: Permit['riskLevel'][] = ['low', 'medium', 'high', 'critical'];
    
    const validFrom = new Date(Date.now() - Math.random() * 3600000 * 8);
    const validTo = new Date(validFrom.getTime() + (2 + Math.random() * 6) * 3600000);
    
    const numWorkers = 2 + Math.floor(Math.random() * 4);
    const workers = FIRST_NAMES.sort(() => Math.random() - 0.5).slice(0, numWorkers).map((n, j) => `${n} ${LAST_NAMES[j % LAST_NAMES.length]}`);
    
    permits.push({
      id: `PTW-${String(i + 1).padStart(4, '0')}`,
      type: template.type,
      title: `${template.type === 'hot-work' ? 'Hot Work' : template.type === 'cold-work' ? 'Cold Work' : template.type === 'confined-space' ? 'Confined Space' : template.type === 'electrical-isolation' ? 'Electrical Isolation' : template.type === 'height-work' ? 'Height Work' : 'Excavation'} - ${title}`,
      description: title,
      zoneId,
      requestedBy: PERMIT_REQUESTERS[Math.floor(Math.random() * PERMIT_REQUESTERS.length)],
      approvedBy: PERMIT_APPROVERS[Math.floor(Math.random() * PERMIT_APPROVERS.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      workers,
      conditions: ['Gas test mandatory before entry', 'Fire extinguisher standby required', 'Continuous gas monitoring'],
      conflictsWith: [],
    });
  }
  
  // Detect conflicts
  const active = permits.filter(p => p.status === 'active');
  for (const p of active) {
    for (const q of active) {
      if (p.id !== q.id && (p.zoneId === q.zoneId || areAdjacent(p.zoneId, q.zoneId))) {
        if (!p.conflictsWith.includes(q.id)) p.conflictsWith.push(q.id);
      }
    }
  }
  
  return permits;
}

function areAdjacent(a: string, b: string): boolean {
  const adjacency: Record<string, string[]> = {
    'coke-oven': ['gas-recovery', 'blast-furnace'],
    'blast-furnace': ['coke-oven', 'sms', 'gas-recovery'],
    'sms': ['blast-furnace', 'rolling-mill'],
    'rolling-mill': ['sms'],
    'gas-recovery': ['coke-oven', 'blast-furnace', 'hazwaste'],
    'water-treatment': ['raw-material', 'control-room'],
    'power-plant': ['oxygen-plant', 'workshop'],
    'oxygen-plant': ['power-plant', 'sms'],
    'hazwaste': ['gas-recovery', 'control-room'],
    'control-room': ['hazwaste', 'water-treatment', 'workshop'],
    'workshop': ['control-room', 'power-plant', 'admin'],
    'admin': ['workshop', 'fire-station'],
    'fire-station': ['admin'],
    'raw-material': ['water-treatment', 'rolling-mill'],
    'main-gate': [],
  };
  return adjacency[a]?.includes(b) || false;
}

// ── Process Units ──

function generateProcessUnits(): ProcessUnit[] {
  return [
    { id: 'CKO-1', name: 'Coke Oven #1', zoneId: 'coke-oven', status: 'running', health: 82, lastMaintenance: '2025-12-15', nextMaintenance: '2026-03-15', parameters: { temperature: 1100, pushingCycles: 48, gasFlow: 1050 } },
    { id: 'CKO-2', name: 'Coke Oven #2', zoneId: 'coke-oven', status: 'running', health: 71, lastMaintenance: '2025-11-20', nextMaintenance: '2026-02-20', parameters: { temperature: 1085, pushingCycles: 45, gasFlow: 980 } },
    { id: 'CKO-3', name: 'Coke Oven #3', zoneId: 'coke-oven', status: 'maintenance', health: 45, lastMaintenance: '2025-10-01', nextMaintenance: '2026-01-30', parameters: { temperature: 0, pushingCycles: 0, gasFlow: 0 } },
    { id: 'BF-1', name: 'Blast Furnace #1', zoneId: 'blast-furnace', status: 'running', health: 88, lastMaintenance: '2026-01-10', nextMaintenance: '2026-07-10', parameters: { hotBlastTemp: 1150, topPressure: 220, oxygenEnrichment: 4.5 } },
    { id: 'BF-2', name: 'Blast Furnace #2', zoneId: 'blast-furnace', status: 'running', health: 76, lastMaintenance: '2025-09-05', nextMaintenance: '2026-03-05', parameters: { hotBlastTemp: 1120, topPressure: 210, oxygenEnrichment: 4.2 } },
    { id: 'BOF-1', name: 'BOF Converter', zoneId: 'sms', status: 'running', health: 91, lastMaintenance: '2026-01-20', nextMaintenance: '2026-04-20', parameters: { blowDuration: 16, oxygenFlow: 680, slagWeight: 12 } },
    { id: 'CC-1', name: 'Continuous Caster', zoneId: 'sms', status: 'running', health: 85, lastMaintenance: '2025-12-28', nextMaintenance: '2026-06-28', parameters: { castingSpeed: 1.4, moldLevel: 82, sprayWater: 450 } },
    { id: 'RHF-1', name: 'Reheating Furnace', zoneId: 'rolling-mill', status: 'running', health: 79, lastMaintenance: '2025-11-15', nextMaintenance: '2026-05-15', parameters: { zoneTemp: 1250, fuelFlow: 320, pushRate: 180 } },
    { id: 'GH-1', name: 'Gas Holder', zoneId: 'gas-recovery', status: 'running', health: 67, lastMaintenance: '2025-08-20', nextMaintenance: '2026-02-20', parameters: { gasVolume: 75000, pressure: 65, purity: 98.2 } },
    { id: 'CT-1', name: 'Cooling Tower', zoneId: 'water-treatment', status: 'running', health: 93, lastMaintenance: '2026-01-05', nextMaintenance: '2026-07-05', parameters: { inletTemp: 42, outletTemp: 28, flowRate: 5000 } },
  ];
}

function updateProcessUnits(units: ProcessUnit[], tick: number): ProcessUnit[] {
  return units.map(u => {
    // Random health fluctuation
    let health = u.health + (Math.random() - 0.52) * 0.5;
    health = Math.max(20, Math.min(100, health));
    
    // Random status changes (very rare)
    let status = u.status;
    if (Math.random() < 0.003 && u.status === 'running') {
      status = 'alarm';
    } else if (u.status === 'alarm' && Math.random() < 0.1) {
      status = 'running';
    }
    
    return { ...u, health: Number(health.toFixed(1)), status };
  });
}

// ── Compound Risk Evaluator ──

interface EvalContext {
  readings: Record<string, SensorReading>;
  permits: Permit[];
  workers: Worker[];
  units: ProcessUnit[];
}

function evaluateCompoundRisks(ctx: EvalContext): import('@/stores/safety-store').CompoundRisk[] {
  const risks: import('@/stores/safety-store').CompoundRisk[] = [];
  const activePermits = ctx.permits.filter(p => p.status === 'active');
  const now = new Date();
  const hour = now.getHours();
  const currentShift = getActiveShift();
  
  // Rule 1: Gas + Hot Work in same/adjacent zone
  const hotWorkPermits = activePermits.filter(p => p.type === 'hot-work');
  for (const permit of hotWorkPermits) {
    const gasSensors = Object.values(ctx.readings).filter(
      r => (r.type === 'CH4' || r.type === 'H2S' || r.type === 'CO') &&
           (r.zoneId === permit.zoneId || areAdjacent(r.zoneId, permit.zoneId))
    );
    const elevatedGas = gasSensors.filter(r => r.status === 'warning' || r.status === 'critical');
    if (elevatedGas.length > 0) {
      const maxGasScore = Math.max(...elevatedGas.map(r => r.status === 'critical' ? 90 : 60));
      const score = Math.min(100, maxGasScore * 0.7 + 30);
      risks.push({
        id: `CR-GAS-HW-${permit.id}`,
        severity: score > 75 ? 'emergency' : score > 50 ? 'critical' : score > 25 ? 'warning' : 'advisory',
        title: 'Gas Accumulation Near Hot Work',
        description: `Elevated ${elevatedGas[0].type} levels detected near active hot work: ${permit.title}`,
        contributingFactors: [
          { type: 'gas-level', source: elevatedGas[0].sensorId, value: elevatedGas[0].value, threshold: 25, weight: 0.6, description: `${elevatedGas[0].type} at ${elevatedGas[0].value} ${elevatedGas[0].unit}` },
          { type: 'permit-conflict', source: permit.id, value: 1, threshold: 0, weight: 0.4, description: `Active hot work permit in ${permit.zoneId}` },
        ],
        affectedZones: [permit.zoneId, elevatedGas[0].zoneId].filter((v, i, a) => a.indexOf(v) === i),
        affectedWorkers: permit.workers.length,
        compoundScore: score,
        individualScores: [maxGasScore, 80],
        predictionLeadTime: Math.max(5, Math.round((100 - score) * 0.5)),
        recommendedActions: ['Suspend hot work permit immediately', 'Evacuate workers from affected zone', 'Activate gas suppression system', 'Alert zone supervisor'],
        timestamp: now,
        escalationHistory: [],
      });
    }
  }
  
  // Rule 2: Confined Space + Gas
  const csPermits = activePermits.filter(p => p.type === 'confined-space');
  for (const permit of csPermits) {
    const gasSensors = Object.values(ctx.readings).filter(
      r => (r.type === 'CH4' || r.type === 'H2S' || r.type === 'CO') && r.zoneId === permit.zoneId
    );
    const anyWarning = gasSensors.some(r => r.status === 'warning' || r.status === 'critical');
    if (anyWarning) {
      const worstGas = gasSensors.sort((a, b) => (b.status === 'critical' ? 1 : 0) - (a.status === 'critical' ? 1 : 0))[0];
      risks.push({
        id: `CR-CS-GAS-${permit.id}`,
        severity: 'critical',
        title: 'Confined Space with Gas Hazard',
        description: `Gas readings elevated during confined space entry: ${permit.title}`,
        contributingFactors: [
          { type: 'gas-level', source: worstGas.sensorId, value: worstGas.value, threshold: 10, weight: 0.5, description: `${worstGas.type} elevated in confined space` },
          { type: 'permit-conflict', source: permit.id, value: 1, threshold: 0, weight: 0.5, description: 'Active confined space entry' },
        ],
        affectedZones: [permit.zoneId],
        affectedWorkers: permit.workers.length,
        compoundScore: 72,
        individualScores: [85, 70],
        predictionLeadTime: 12,
        recommendedActions: ['Evacuate confined space immediately', 'Continuous gas monitoring mandatory', 'Standby rescue team at entry point'],
        timestamp: now,
        escalationHistory: [],
      });
    }
  }
  
  // Rule 3: Shift changeover + active permits  
  const isShiftChange = (hour === 6 || hour === 14 || hour === 22) || ((hour === 5 || hour === 13 || hour === 21) && now.getMinutes() >= 30);
  if (isShiftChange && activePermits.length > 3) {
    risks.push({
      id: 'CR-SHIFT-PERMIT',
      severity: 'warning',
      title: 'Shift Changeover with Multiple Active Permits',
      description: `${activePermits.length} active permits during shift changeover — handover risk elevated`,
      contributingFactors: [
        { type: 'shift-timing', source: 'clock', value: activePermits.length, threshold: 3, weight: 0.5, description: 'Shift changeover window' },
        { type: 'permit-conflict', source: 'multiple', value: activePermits.length, threshold: 3, weight: 0.5, description: `${activePermits.length} concurrent active permits` },
      ],
      affectedZones: [...new Set(activePermits.map(p => p.zoneId))],
      affectedWorkers: activePermits.reduce((sum, p) => sum + p.workers.length, 0),
      compoundScore: 38,
      individualScores: [45, 50],
      predictionLeadTime: 30,
      recommendedActions: ['Ensure all permits have proper handover documentation', 'Safety officer to verify each active permit before shift change', 'Brief incoming shift on all active hazardous work'],
      timestamp: now,
      escalationHistory: [],
    });
  }
  
  // Rule 4: Equipment Alarm + Worker Density
  const alarmUnits = ctx.units.filter(u => u.status === 'alarm');
  for (const unit of alarmUnits) {
    const workersInZone = ctx.workers.filter(w => w.currentZone === unit.zoneId && w.status === 'active');
    const zone = ZONE_DEFS.find(z => z.id === unit.zoneId);
    if (zone && workersInZone.length > zone.maxOccupancy * 0.6) {
      risks.push({
        id: `CR-ALARM-DENSITY-${unit.id}`,
        severity: 'critical',
        title: 'Equipment Alarm with High Worker Density',
        description: `${unit.name} in ALARM state with ${workersInZone.length} workers in zone (${Math.round(workersInZone.length / zone.maxOccupancy * 100)}% occupancy)`,
        contributingFactors: [
          { type: 'equipment-status', source: unit.id, value: 1, threshold: 0, weight: 0.5, description: `${unit.name} in alarm state` },
          { type: 'worker-density', source: unit.zoneId, value: workersInZone.length, threshold: zone.maxOccupancy * 0.8, weight: 0.5, description: `${workersInZone.length}/${zone.maxOccupancy} workers` },
        ],
        affectedZones: [unit.zoneId],
        affectedWorkers: workersInZone.length,
        compoundScore: 68,
        individualScores: [80, 70],
        predictionLeadTime: 8,
        recommendedActions: ['Reduce zone occupancy immediately', 'Investigate equipment alarm', 'Non-essential personnel to evacuate'],
        timestamp: now,
        escalationHistory: [],
      });
    }
  }
  
  // Rule 5: Night shift + critical readings
  if (currentShift === 'night') {
    const criticalReadings = Object.values(ctx.readings).filter(r => r.status === 'critical');
    if (criticalReadings.length >= 2) {
      risks.push({
        id: 'CR-NIGHT-CRITICAL',
        severity: 'warning',
        title: 'Multiple Critical Readings During Night Shift',
        description: `${criticalReadings.length} sensors in CRITICAL state during night shift with reduced supervision`,
        contributingFactors: [
          { type: 'shift-timing', source: 'clock', value: 1, threshold: 0, weight: 0.4, description: 'Night shift — reduced supervision' },
          { type: 'gas-level', source: 'multiple', value: criticalReadings.length, threshold: 1, weight: 0.6, description: `${criticalReadings.length} critical sensor readings` },
        ],
        affectedZones: [...new Set(criticalReadings.map(r => r.zoneId))],
        affectedWorkers: 15,
        compoundScore: 55,
        individualScores: [60, 75],
        predictionLeadTime: 20,
        recommendedActions: ['Alert night shift supervisor immediately', 'Dispatch additional safety officer to affected zones', 'Prepare for potential escalation'],
        timestamp: now,
        escalationHistory: [],
      });
    }
  }
  
  // Rule 6: PPE violations in hazardous zones
  const highHazardZones = ZONE_DEFS.filter(z => z.hazardLevel >= 4);
  for (const zone of highHazardZones) {
    const ppeViolators = ctx.workers.filter(w => w.currentZone === zone.id && !w.ppeCompliance && w.status === 'active');
    if (ppeViolators.length > 0) {
      risks.push({
        id: `CR-PPE-${zone.id}`,
        severity: ppeViolators.length >= 3 ? 'critical' : 'warning',
        title: `PPE Non-Compliance in ${zone.name}`,
        description: `${ppeViolators.length} worker(s) without proper PPE in high-hazard zone`,
        contributingFactors: [
          { type: 'ppe-violation', source: zone.id, value: ppeViolators.length, threshold: 0, weight: 0.6, description: `${ppeViolators.length} PPE violations` },
          { type: 'worker-density', source: zone.id, value: zone.hazardLevel, threshold: 3, weight: 0.4, description: `Hazard Level ${zone.hazardLevel} zone` },
        ],
        affectedZones: [zone.id],
        affectedWorkers: ppeViolators.length,
        compoundScore: ppeViolators.length >= 3 ? 62 : 35,
        individualScores: [70, 50],
        predictionLeadTime: 45,
        recommendedActions: ['Issue immediate PPE compliance notice', 'Zone supervisor to verify and enforce', 'Log violation for safety audit'],
        timestamp: now,
        escalationHistory: [],
      });
    }
  }
  
  // Rule 7: Low equipment health + elevated readings
  const degradedUnits = ctx.units.filter(u => u.health < 60);
  for (const unit of degradedUnits) {
    const zoneReadings = Object.values(ctx.readings).filter(r => r.zoneId === unit.zoneId && (r.status === 'warning' || r.status === 'critical'));
    if (zoneReadings.length > 0) {
      risks.push({
        id: `CR-DEGRADE-${unit.id}`,
        severity: 'warning',
        title: `Equipment Degradation with Elevated Readings`,
        description: `${unit.name} at ${unit.health}% health with ${zoneReadings.length} elevated sensor readings in zone`,
        contributingFactors: [
          { type: 'equipment-status', source: unit.id, value: unit.health, threshold: 60, weight: 0.5, description: `Equipment health at ${unit.health}%` },
          { type: 'gas-level', source: zoneReadings[0].sensorId, value: zoneReadings[0].value, threshold: 25, weight: 0.5, description: `Elevated ${zoneReadings[0].type} in zone` },
        ],
        affectedZones: [unit.zoneId],
        affectedWorkers: 5,
        compoundScore: 42,
        individualScores: [55, 50],
        predictionLeadTime: 35,
        recommendedActions: ['Schedule immediate maintenance inspection', 'Increase monitoring frequency', 'Prepare backup equipment'],
        timestamp: now,
        escalationHistory: [],
      });
    }
  }
  
  return risks;
}

// ── Simulation Provider ──

const SimulationContext = createContext<{ tick: number }>({ tick: 0 });

export function useSimulationTick() {
  return useContext(SimulationContext);
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const tickRef = useRef(0);
  const workersRef = useRef<Worker[]>([]);
  const unitsRef = useRef<ProcessUnit[]>([]);
  const permitsRef = useRef<Permit[]>([]);
  const initializedRef = useRef(false);
  
  const store = useSafetyStore;
  
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    // Initialize data lazily to avoid blocking first render
    const state = store.getState();
    state.setZones(ZONE_DEFS);
    state.setCurrentShift(getActiveShift());
    
    // Defer heavy data generation so UI paints fast
    const initTimeout = setTimeout(() => {
      workersRef.current = generateAllWorkers();
      store.getState().setWorkers(workersRef.current);
      
      unitsRef.current = generateProcessUnits();
      store.getState().setProcessUnits(unitsRef.current);
      
      permitsRef.current = generatePermits();
      store.getState().setPermits(permitsRef.current);
      
      // Generate initial sensor readings immediately
      const initialReadings = SENSOR_DEFS.map(s => generateSensorReading(s, 0));
      store.getState().updateSensorReadings(initialReadings);
    }, 100);
    
    // Start simulation loop (delayed so UI renders first)
    const interval = setInterval(() => {
      const state = store.getState();
      if (!state.isSimulating) return;
      
      tickRef.current += 1;
      setTick(tickRef.current);
      
      // Update sensor readings every tick (2.5s)
      const readings = SENSOR_DEFS.map(s => generateSensorReading(s, tickRef.current));
      state.updateSensorReadings(readings);
      
      // Update workers every 5th tick (less often = smoother)
      if (tickRef.current % 5 === 0) {
        workersRef.current = updateWorkers(workersRef.current);
        state.setWorkers(workersRef.current);
      }
      
      // Update process units every 4th tick
      if (tickRef.current % 4 === 0) {
        unitsRef.current = updateProcessUnits(unitsRef.current, tickRef.current);
        state.setProcessUnits(unitsRef.current);
      }
      
      // Update permits every 10th tick
      if (tickRef.current % 10 === 0) {
        // Randomly close/open permits
        permitsRef.current = permitsRef.current.map(p => {
          if (p.status === 'active' && Math.random() < 0.1) return { ...p, status: 'closed' as const };
          if (p.status === 'approved' && Math.random() < 0.2) return { ...p, status: 'active' as const };
          return p;
        });
        state.setPermits(permitsRef.current);
      }
      
      // Evaluate compound risks every 3rd tick
      if (tickRef.current % 3 === 0) {
        const currentReadings = store.getState().sensorReadings;
        const risks = evaluateCompoundRisks({
          readings: currentReadings,
          permits: permitsRef.current,
          workers: workersRef.current,
          units: unitsRef.current,
        });
        state.setCompoundRisks(risks);
        
        // Generate alerts from new critical/emergency risks
        for (const risk of risks) {
          if (risk.severity === 'critical' || risk.severity === 'emergency') {
            const existingAlert = state.alerts.find(a => a.compoundRiskId === risk.id);
            if (!existingAlert) {
              state.addAlert({
                id: `ALERT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                severity: risk.severity,
                title: risk.title,
                description: risk.description,
                zone: risk.affectedZones[0] || '',
                source: 'Compound Risk Engine',
                timestamp: Date.now(),
                acknowledged: false,
                compoundRiskId: risk.id,
              });
            }
          }
        }
        
        // Also generate alerts from individual critical sensors
        for (const reading of readings) {
          if (reading.status === 'critical' && Math.random() < 0.3) {
            const zone = ZONE_DEFS.find(z => z.id === reading.zoneId);
            state.addAlert({
              id: `ALERT-SENSOR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              severity: 'warning',
              title: `${reading.type} Critical in ${zone?.name || reading.zoneId}`,
              description: `${reading.type} reading at ${reading.value} ${reading.unit} exceeds critical threshold`,
              zone: reading.zoneId,
              source: reading.sensorId,
              timestamp: Date.now(),
              acknowledged: false,
            });
          }
        }
      }
      
      // Update shift
      state.setCurrentShift(getActiveShift());
      
    }, 3500); // 3.5 second cycle — balanced between realism and performance
    
    return () => { clearInterval(interval); clearTimeout(initTimeout); };
  }, []);
  
  return (
    <SimulationContext.Provider value={{ tick }}>
      {children}
    </SimulationContext.Provider>
  );
}
