# FinGuard SafetyOS — System Architecture & Design Specification

This document provides a detailed overview of the system architecture, data models, and communication schemas of the **FinGuard SafetyOS** platform.

---

## 1. High-Level Architecture Overview

SafetyOS is structured as a real-time, event-driven data pipeline that processes high-frequency industrial data streams and applies a sequential multi-agent orchestration layer to calculate compound risk, trace regulatory compliance, and execute emergency response procedures.

```
       [ HIGH-FREQUENCY DATA INGESTION ]
       ├─ IoT Sensor Streams (31 continuous readings)
       ├─ SCADA / DCS Process Control Data
       ├─ CCTV / Edge AI (PPE detection metrics)
       └─ Digital Permit-to-Work (PTW) DB
                       │
                       ▼
       [ SEQUENTIAL MULTI-AGENT PIPELINE ]
       ┌───────────────────────────────┐
       │ 1. Sensor Fusion Agent        │──► Anomalies & drift analytics
       └───────────────────────────────┘
                       │ (Sensor Output JSON)
                       ▼
       ┌───────────────────────────────┐
       │ 2. Vision Analytics Agent     │──► PPE compliance context
       └───────────────────────────────┘
                       │ (Vision Output JSON)
                       ▼
       ┌───────────────────────────────┐
       │ 3. Permit Intelligence Agent  │──► Spatial & temporal conflicts
       └───────────────────────────────┘
                       │ (Permit Output JSON)
                       ▼
       ┌───────────────────────────────┐
       │ 4. Compound Risk Agent        │──► Multi-factor scoring + RAG
       └───────────────────────────────┘
                       │ (Compound Risk JSON)
                       ▼
       ┌───────────────────────────────┐
       │ 5. Emergency Response Agent   │──► SCADA interlocks & alerts
       └───────────────────────────────┘
                       │ (Emergency Output JSON)
                       ▼
         [ REAL-TIME VISUALIZATION & ACTIONS ]
         ├─ Command Center Dashboard (Digital Twin)
         ├─ RAG-powered Copilot Chat
         └─ SCADA Emergency Shutdown Trigger (ESD)
```

---

## 2. Agent Message-Passing Schema (Data Contracts)

To guarantee absolute traceability and explainability, every pipeline execution passes strongly-typed JSON data between agents. The output of one agent serves as the input of the next.

### 2.1 Sensor Fusion Agent Output (Input to Vision Agent)
```json
{
  "agentId": "sensor-agent",
  "timestamp": 1783517400,
  "anomalies": [
    {
      "sensorId": "CO-SEN-04",
      "zoneId": "coke-oven",
      "type": "CO",
      "value": 24.5,
      "unit": "ppm",
      "status": "warning",
      "deviation": 22.5,
      "rateOfChange": 0.4,
      "projectedTimeToThreshold": 18
    }
  ],
  "zoneRiskScores": {
    "coke-oven": 35.0,
    "blast-furnace": 12.0
  }
}
```

### 2.2 Vision Analytics Agent Output (Input to Permit Agent)
```json
{
  "agentId": "vision-agent",
  "timestamp": 1783517410,
  "violations": [
    {
      "workerId": "WKR-042",
      "workerName": "Yogesh Kumar",
      "zone": "coke-oven",
      "missingPPE": ["Face Shield", "Gas Mask"],
      "confidence": 98.2,
      "hazardContext": "Worker in high-hazard coke-oven zone without required respiratory protection during gas drift."
    }
  ],
  "complianceRate": 94.5
}
```

### 2.3 Permit Intelligence Agent Output (Input to Risk Agent)
```json
{
  "agentId": "permit-agent",
  "timestamp": 1783517420,
  "activePermits": 12,
  "conflicts": [
    {
      "permitA": "PTW-0042",
      "permitB": "PTW-0089",
      "zone": "coke-oven",
      "conflictType": "Hot Work near Gas Recovery Pipe CKO-2",
      "riskIncrease": 45.0,
      "regulation": "OISD-STD-154, Section 4.3.2"
    }
  ],
  "gasTestViolations": [
    {
      "permitId": "PTW-0042",
      "lastTestMinutesAgo": 45,
      "requiredInterval": 30,
      "regulation": "OISD-STD-154, Section 4.3.2"
    }
  ]
}
```

### 2.4 Compound Risk Agent Output (Input to Emergency Agent)
```json
{
  "agentId": "risk-agent",
  "timestamp": 1783517430,
  "compoundRisks": [
    {
      "id": "CR-coke-oven-1783517430",
      "title": "Gas Accumulation + Hot Work + PPE Violation in Coke Oven Battery",
      "riskScore": 84,
      "confidence": 93,
      "severity": "critical",
      "factors": [
        { "name": "Gas Level (CO: 24.5 ppm)", "score": 68, "weight": 35 },
        { "name": "Permit Conflicts (1 active)", "score": 85, "weight": 25 },
        { "name": "PPE Violations (1 worker)", "score": 40, "weight": 15 },
        { "name": "Shift Change Window", "score": 55, "weight": 10 },
        { "name": "Historical Pattern Match", "score": 87, "weight": 15 }
      ],
      "explanation": "CO concentration at 24.5 ppm is 22.5% above baseline, rising at +0.4 ppm/min. Projected threshold breach in 18 min. Permit conflict detected: Hot Work near Gas Recovery Pipe CKO-2. Worker Yogesh Kumar is in Coke Oven Battery without Face Shield or Gas Mask. Shift changeover active. Matches Visakhapatnam 2025 incident precursors.",
      "historicalSimilarity": 87,
      "predictionLeadTime": 18,
      "regulations": [
        "OISD-STD-144, Section 4.1",
        "OISD-STD-154, Section 6.1",
        "OISD-STD-192, Section 3.4",
        "DGMS Safety Circular 7/2024"
      ]
    }
  ],
  "overallPlantRisk": 42
}
```

### 2.5 Emergency Response Agent Output
```json
{
  "agentId": "emergency-agent",
  "timestamp": 1783517440,
  "recommendations": [
    {
      "priority": 1,
      "action": "Suspend hot work permit PTW-0042",
      "impactPercent": 42,
      "urgency": "immediate",
      "targetZone": "coke-oven"
    },
    {
      "priority": 2,
      "action": "Evacuate Coke Oven Battery — 16 workers to Muster Point B",
      "impactPercent": 31,
      "urgency": "immediate",
      "targetZone": "coke-oven",
      "affectedWorkers": 16
    },
    {
      "priority": 3,
      "action": "Activate emergency exhaust ventilation system in Coke Oven Battery",
      "impactPercent": 18,
      "urgency": "immediate",
      "targetZone": "coke-oven"
    }
  ],
  "evacuationRequired": true,
  "evacuationZones": ["coke-oven"]
}
```

---

## 3. Regulatory RAG (Retrieval-Augmented Generation) Design

The RAG layer allows safety officers to ask SafetyOS questions using natural language. The architecture is as follows:

1. **Document Corpus:** 14 documents from OISD, Factories Act 1948, and DGMS circulars are tokenized.
2. **Metadata Tagging:** Documents are tagged with keywords (e.g. "gas", "confined space") and applicable hazard classes.
3. **Retrieval Algorithm:** Keyword matching and hazard classification scores are combined to retrieve relevant sections.
4. **Context Injection:** Excerpts are formatted as citations and injected into the response to provide direct evidence for every recommendation.
