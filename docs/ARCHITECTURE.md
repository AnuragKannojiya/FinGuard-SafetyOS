# 🏗️ FinGuard SafetyOS — System Architecture & Data Contracts

This document outlines the detailed system architecture, data ingestion layers, and data contracts between the sequential AI agents running in the SafetyOS pipeline.

---

## 1. High-Level Ingestion Flow
Data is ingested from four siloed systems and normalized into state schemas managed by the global Zustand store:

```
[IoT Telemetry] ➔ CH4, CO, O2, Temp, Pressure
[CCTV Video]    ➔ Bounding Box PPE Detection Arrays
[Digital PTW]   ➔ Spatial coordinates, duration, type, status
[Workforce API] ➔ Personnel position coordinates, shifts, roles
```

---

## 2. Multi-Agent Pipeline Data Contracts
SafetyOS runs a deterministic, sequential execution pipeline in `agent-pipeline.ts` where each agent consumes the outputs of the preceding node.

### Node 1: Sensor Fusion Agent
* **Input:** Raw telemetry streams.
* **Output Schema (JSON):**
```json
{
  "agentId": "sensor-agent",
  "timestamp": 1783604375944,
  "anomalies": [
    {
      "sensorId": "SEN-COB-GAS-01",
      "zoneId": "coke-oven",
      "type": "CH4",
      "value": 14.9,
      "unit": "ppm",
      "status": "warning",
      "deviation": 49,
      "rateOfChange": 0.35,
      "projectedTimeToThreshold": 17
    }
  ],
  "zoneRiskScores": {
    "coke-oven": 35.0,
    "blast-furnace": 12.0
  }
}
```

### Node 2: Vision Analytics Agent
* **Input:** CCTV analytics frames and Zone Telemetry JSON.
* **Output Schema (JSON):**
```json
{
  "agentId": "vision-agent",
  "violations": [
    {
      "workerId": "WKR-042",
      "workerName": "Yogesh Kumar",
      "zone": "coke-oven",
      "missingPPE": ["Face Shield", "Gas Mask"],
      "confidence": 98.0,
      "hazardContext": "High-risk Coke Oven zone has elevated gas (14.9 ppm). Respiratory protective equipment is mandatory."
    }
  ],
  "complianceRate": 87.0
}
```

### Node 3: Permit Intelligence Agent
* **Input:** Digital PTW logs and PPE Compliance JSON.
* **Output Schema (JSON):**
```json
{
  "agentId": "permit-agent",
  "conflicts": [
    {
      "permitA": "PTW-0042 (Hot Work)",
      "permitB": "None",
      "zone": "coke-oven",
      "conflictType": "Hot Work in Elevated Gas Hazard Zone",
      "riskIncrease": 38,
      "regulation": "OISD-STD-154, Section 4.3.2 - Prohibits hot work in flammable gas areas."
    }
  ],
  "gasTestViolations": [
    {
      "permitId": "PTW-0042",
      "lastTestMinutesAgo": 45,
      "requiredInterval": 30,
      "regulation": "OISD-STD-154 requires gas testing every 30 minutes during hot work."
    }
  ]
}
```

### Node 4: Compound Risk Agent
* **Input:** Permit Conflict JSON and Historical Precursor Database.
* **Output Schema (JSON):**
```json
{
  "agentId": "risk-agent",
  "compoundRisks": [
    {
      "id": "CR-coke-oven-1783604375944",
      "title": "Gas Accumulation + Permit Conflict in Coke Oven Battery",
      "riskScore": 84,
      "confidence": 93,
      "severity": "critical",
      "factors": [
        { "name": "Gas Level (CH4: 14.9 ppm)", "score": 49, "weight": 35 },
        { "name": "Permit Conflicts (1 active)", "score": 80, "weight": 25 },
        { "name": "PPE Violations (1 worker)", "score": 40, "weight": 15 },
        { "name": "Historical Pattern Match", "score": 87, "weight": 15 }
      ],
      "historicalSimilarity": 87,
      "predictionLeadTime": 17,
      "regulations": ["OISD-STD-144, Section 4.1", "OISD-STD-154, Section 6.1"]
    }
  ]
}
```

### Node 5: Emergency Response Agent
* **Input:** Compound Risks JSON.
* **Output Schema (JSON):**
```json
{
  "agentId": "emergency-agent",
  "recommendations": [
    {
      "priority": 1,
      "action": "Suspend hot work permit PTW-0042 immediately",
      "impactPercent": 42,
      "urgency": "immediate",
      "targetZone": "coke-oven"
    },
    {
      "priority": 2,
      "action": "Initiate preemptive evacuation of Coke Oven Battery (16 workers)",
      "impactPercent": 31,
      "urgency": "immediate",
      "targetZone": "coke-oven"
    }
  ],
  "evacuationRequired": true,
  "evacuationZones": ["coke-oven"]
}
```

---

## 3. UI Implementation & State Bindings
The dashboard is modular and decoupled from calculations:
- `simulation-provider.tsx` drives the telemetry clock ticks.
- Zustand store handles atomic states, ensuring that calculating risks for 150 worker vectors does not cause layout lag.
- Heatmap renders using inline SVGs, allowing the browser to repaint only the modified coordinate nodes, resulting in high rendering performance.
