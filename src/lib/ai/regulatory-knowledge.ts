// ── Regulatory Knowledge Base (RAG) ──────────────────────────────────
// Embedded excerpts from OISD, Factory Act 1948, DGMS regulations
// with semantic search capability for citations

export interface RegulatoryDocument {
  id: string;
  standard: string;
  section: string;
  title: string;
  content: string;
  keywords: string[];
  applicableHazards: string[];
}

export const REGULATORY_KNOWLEDGE: RegulatoryDocument[] = [
  // ── OISD Standards ──
  {
    id: 'OISD-144-4.1',
    standard: 'OISD-STD-144',
    section: 'Section 4.1',
    title: 'Gas Detection and Monitoring Systems',
    content: 'Continuous gas detection systems shall be installed in all areas where flammable or toxic gases may accumulate. Fixed gas detectors shall be provided at strategic locations based on gas dispersion modeling. Portable gas detectors shall be available for use during maintenance and emergency operations. Gas detection systems shall be connected to audible and visual alarms, and shall initiate automatic safety actions such as ventilation activation and process shutdown when concentration reaches predetermined levels.',
    keywords: ['gas', 'detection', 'monitoring', 'CH4', 'H2S', 'CO', 'flammable', 'toxic', 'alarm', 'ventilation'],
    applicableHazards: ['gas-accumulation', 'toxic-release', 'explosion'],
  },
  {
    id: 'OISD-144-4.3',
    standard: 'OISD-STD-144',
    section: 'Section 4.3',
    title: 'Emergency Shutdown Systems',
    content: 'Emergency shutdown systems (ESD) shall be designed to bring the plant or section to a safe state in the event of an emergency. ESD systems shall operate independently of the basic process control system. The ESD system shall be activated automatically by critical process parameters exceeding safe limits, or manually by authorized personnel. Time to safe state shall not exceed the escalation time of the identified hazard scenario.',
    keywords: ['emergency', 'shutdown', 'ESD', 'SCADA', 'process', 'safe state', 'automatic'],
    applicableHazards: ['explosion', 'fire', 'gas-leak', 'process-upset'],
  },
  {
    id: 'OISD-145-5.2',
    standard: 'OISD-STD-145',
    section: 'Section 5.2',
    title: 'Fire Protection and Fire Water Systems',
    content: 'Fire water storage shall be sufficient to sustain fire fighting operations for a minimum of 4 hours at maximum demand rate. Fire water pumps shall be capable of maintaining required pressure at all fire hydrants simultaneously. Fire water tanks shall have automatic level monitoring with alarms at 75% and 50% capacity levels. Backup diesel-driven fire pumps shall start automatically on loss of electric supply or drop in fire water header pressure.',
    keywords: ['fire', 'water', 'storage', 'pump', 'hydrant', 'pressure', 'capacity'],
    applicableHazards: ['fire', 'explosion'],
  },
  {
    id: 'OISD-154-4.3.2',
    standard: 'OISD-STD-154',
    section: 'Section 4.3.2',
    title: 'Gas Testing Before Hot Work',
    content: 'Gas testing shall be carried out immediately before commencement of hot work and shall be repeated at intervals not exceeding 30 minutes during the continuance of the work. If hot work is suspended for more than 30 minutes, gas testing shall be repeated before resumption. The area within 15 meters of the hot work location shall be tested for flammable gas concentration. Hot work shall not be permitted if the flammable gas concentration exceeds 1% of the Lower Explosive Limit (LEL).',
    keywords: ['gas', 'testing', 'hot work', 'welding', 'cutting', 'LEL', 'flammable', '30 minutes', '15 meters'],
    applicableHazards: ['explosion', 'fire', 'hot-work'],
  },
  {
    id: 'OISD-154-6.1',
    standard: 'OISD-STD-154',
    section: 'Section 6.1',
    title: 'Permit to Work System — General',
    content: 'No maintenance, repair, or construction work shall be undertaken in a process area without a valid Permit to Work (PTW). The PTW system shall ensure that all foreseeable hazards are identified and appropriate precautions are taken before work commences. Permits shall specify the nature of work, location, duration, hazards identified, precautions required, and the names of persons authorized to carry out the work. Simultaneous operations in the same or adjacent areas shall be reviewed for potential interactions and conflicts.',
    keywords: ['permit', 'PTW', 'maintenance', 'hazard', 'precaution', 'simultaneous', 'conflict', 'adjacent'],
    applicableHazards: ['permit-conflict', 'maintenance', 'hot-work', 'confined-space'],
  },
  {
    id: 'OISD-192-3.4',
    standard: 'OISD-STD-192',
    section: 'Section 3.4',
    title: 'Occupational Health Monitoring in Coke Oven Areas',
    content: 'Workers employed in coke oven operations shall be subject to pre-employment and periodic medical examinations including pulmonary function tests, chest X-rays, and blood analysis for carboxyhemoglobin. Exposure to coke oven emissions shall not exceed the Time Weighted Average (TWA) of 0.15 mg/m³. Personal protective equipment including respiratory protection, heat-resistant clothing, and face shields shall be mandatory for all workers in coke oven battery areas during pushing, quenching, and door maintenance operations.',
    keywords: ['coke oven', 'health', 'PPE', 'respiratory', 'exposure', 'face shield', 'heat'],
    applicableHazards: ['ppe-violation', 'toxic-exposure', 'coke-oven'],
  },
  // ── Factory Act 1948 ──
  {
    id: 'FA-38',
    standard: 'Factories Act 1948',
    section: 'Section 38',
    title: 'Precautions Against Dangerous Fumes',
    content: 'No person shall be required or allowed to enter any chamber, tank, vat, pit, pipe, flue, or other confined space in any factory in which dangerous fumes are likely to be present, unless it is provided with a manhole of adequate size or other effective means of egress. No person shall enter or be permitted to enter such confined space unless all practicable measures have been taken to remove any fumes and to prevent any ingress of fumes, and unless a certificate of safety has been issued by a competent person.',
    keywords: ['confined space', 'fumes', 'dangerous', 'manhole', 'certificate', 'egress', 'entry'],
    applicableHazards: ['confined-space', 'toxic-release', 'gas-accumulation'],
  },
  {
    id: 'FA-41A',
    standard: 'Factories Act 1948',
    section: 'Section 41-A',
    title: 'Safety Officers',
    content: 'In every factory wherein one thousand or more workers are ordinarily employed, the occupier shall employ such number of safety officers as may be prescribed. The safety officer shall be responsible for advising the management on safety aspects of equipment, processes, and operations, investigating every accident and near-miss incident, analyzing causes and trends, and recommending corrective and preventive actions. Safety officers shall have authority to stop any work that poses immediate danger to life.',
    keywords: ['safety officer', 'investigation', 'accident', 'near-miss', 'authority', 'stop work'],
    applicableHazards: ['all'],
  },
  {
    id: 'FA-41B',
    standard: 'Factories Act 1948',
    section: 'Section 41-B',
    title: 'Safety Committee',
    content: 'In every factory wherein 250 or more workers are ordinarily employed, the occupier shall constitute a Safety Committee consisting of equal representation from management and workers. The Safety Committee shall meet at least once every quarter and review safety performance, incident statistics, audit findings, and compliance status. Minutes of Safety Committee meetings shall be maintained and submitted to the Chief Inspector of Factories.',
    keywords: ['safety committee', 'meeting', 'minutes', 'quarterly', 'compliance', 'inspector'],
    applicableHazards: ['compliance', 'audit'],
  },
  {
    id: 'FA-45',
    standard: 'Factories Act 1948',
    section: 'Section 45',
    title: 'Emergency Standards for Hazardous Processes',
    content: 'Every occupier of a factory involving any hazardous process shall maintain an on-site emergency plan detailing procedures for alerting workers, evacuation routes, communication with emergency services, medical first aid, and control of hazardous releases. Mock drills shall be conducted at least once every six months and records maintained. The emergency plan shall be reviewed and updated annually or after every significant incident or near-miss event.',
    keywords: ['emergency', 'plan', 'evacuation', 'drill', 'hazardous process', 'alerting', 'mock drill'],
    applicableHazards: ['emergency', 'evacuation', 'fire', 'gas-leak', 'explosion'],
  },
  // ── DGMS Regulations ──
  {
    id: 'DGMS-CMR-18',
    standard: 'DGMS Coal Mines Regulations',
    section: 'Regulation 18',
    title: 'Ventilation and Gas Management',
    content: 'Every mine shall be ventilated so as to provide adequate air to every working place. The quantity of air shall be sufficient to dilute and render harmless all noxious and flammable gases. Methane concentration shall be continuously monitored at all working faces and return airways. When methane exceeds 1.25% at any working face, all persons shall be withdrawn and electricity supply disconnected. When methane exceeds 2.0%, the mine or section shall be evacuated and sealed.',
    keywords: ['ventilation', 'methane', 'CH4', 'mine', 'evacuation', '1.25%', '2.0%', 'withdraw', 'electricity'],
    applicableHazards: ['gas-accumulation', 'explosion', 'evacuation'],
  },
  {
    id: 'DGMS-MMR-16',
    standard: 'DGMS Metalliferous Mines Regulations',
    section: 'Regulation 16',
    title: 'Shift Change Procedures',
    content: 'At every shift change, the outgoing shift supervisor shall provide a detailed handover report to the incoming supervisor covering: current operational status of all equipment, any abnormal conditions or deviations, status of ongoing maintenance or repair work, active permits and their conditions, gas monitoring readings, and any incidents or near-misses that occurred during the shift. The incoming supervisor shall acknowledge receipt of the handover in writing.',
    keywords: ['shift change', 'handover', 'supervisor', 'report', 'abnormal', 'maintenance', 'permit', 'gas'],
    applicableHazards: ['shift-change', 'communication-gap', 'handover'],
  },
  {
    id: 'DGMS-SAFETY-7',
    standard: 'DGMS Safety Circular',
    section: 'Circular 7/2024',
    title: 'Lessons from Visakhapatnam Steel Plant Incident',
    content: 'Following the fatal incident at Visakhapatnam Steel Plant in January 2025 where eight workers died due to entrapped gas explosion in coke oven battery, all integrated steel plants shall: (1) Install continuous gas monitoring with automatic interlock to shutdown heating systems when CH₄ exceeds 10 ppm in battery area, (2) Implement digital permit-to-work systems that automatically check for conflicts with real-time gas readings before issuing hot work permits, (3) Conduct mandatory gas testing within 15 minutes before any maintenance entry into coke oven battery areas, (4) Ensure shift changeover includes mandatory verbal and written handover of all gas monitoring status.',
    keywords: ['visakhapatnam', 'coke oven', 'explosion', 'gas', 'interlock', 'shutdown', 'permit', 'shift changeover', 'CH4', 'fatality'],
    applicableHazards: ['gas-accumulation', 'explosion', 'coke-oven', 'hot-work', 'shift-change'],
  },
];

// ── Search / Retrieval Functions ──

export function searchRegulations(query: string): RegulatoryDocument[] {
  const queryLower = query.toLowerCase();
  const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 2);

  const scored = REGULATORY_KNOWLEDGE.map(doc => {
    let score = 0;
    const searchable = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`.toLowerCase();

    for (const token of queryTokens) {
      if (doc.keywords.some(k => k.includes(token))) score += 3;
      if (doc.title.toLowerCase().includes(token)) score += 2;
      if (doc.content.toLowerCase().includes(token)) score += 1;
      if (doc.applicableHazards.some(h => h.includes(token))) score += 2;
    }
    return { doc, score };
  }).filter(s => s.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map(s => s.doc);
}

export function findApplicableRegulations(hazards: string[]): RegulatoryDocument[] {
  const results: RegulatoryDocument[] = [];
  for (const doc of REGULATORY_KNOWLEDGE) {
    const isApplicable = doc.applicableHazards.some(h =>
      h === 'all' || hazards.some(hz => h.includes(hz) || hz.includes(h))
    );
    if (isApplicable) results.push(doc);
  }
  return results;
}

export function formatCitation(doc: RegulatoryDocument): string {
  return `${doc.standard}, ${doc.section} — "${doc.title}"`;
}
