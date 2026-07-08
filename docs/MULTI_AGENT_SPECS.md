# FinGuard SafetyOS — Multi-Agent System Specification

This document details the exact inputs, internal reasoning logic, outputs, and safety guidelines for the 5 agents operating in the **FinGuard SafetyOS** sequential pipeline.

---

## 🤖 Agent 1: Sensor Fusion Agent

### Objective
Ingest raw telemetry from plant sensors, detect anomalies, calculate drift trajectories, and project times before alarm thresholds are breached.

### Data Inputs
* **Telemetry Streams:** Raw `value`, `unit`, and `timestamp` from 31 plant-wide sensors (CH₄, CO, O₂, H₂S, Temperature, Pressure).
* **Sensor Baseline Configuration:** Safe operational ranges, warning thresholds, and critical thresholds.

### Internal Logic
1. **Status Classification:** Compares raw values against warning and critical thresholds.
2. **Drift Rate Analysis:** Calculates rate of change ($\Delta V/\Delta t$) over a rolling 5-minute window.
3. **Time-to-Threshold Projection:** If the drift is positive (or negative for O₂), calculates:
   $$T_{\text{breach}} = \frac{V_{\text{threshold}} - V_{\text{current}}}{\text{Rate of Change}}$$
4. **Zone Risk Aggregation:** Summarizes anomalies in each zone to yield a base risk indicator.

### Outputs
* JSON data contract listing active anomalies, zone risk indicators, rate of change, and projected time to breach.

---

## 🤖 Agent 2: Vision Analytics Agent

### Objective
Ingest edge computer vision safety metadata to determine workforce PPE compliance status and safety density per zone.

### Data Inputs
* **Vision Event Metadata:** Detection lists containing worker identifier, zone location, and compliance boolean arrays (Helmet, Safety Vest, Gloves, Face Shield, Boots).
* **Edge Model Confidence:** Detection probability percentage for each class.

### Internal Logic
1. **Individual Assessment:** Verifies if the worker has all mandatory PPE items.
2. **Hazard Context Matching:** If a worker is missing items (e.g. gloves), cross-references the hazard class of their current zone (e.g. hot work zone). Missing a face shield in a welding zone flags a critical violation instead of an advisory one.
3. **Compliance Rate Calculation:** Computes the overall plant compliance score.

### Outputs
* JSON listing individual worker violations, active missing PPE arrays, and local compliance percentage.

---

## 🤖 Agent 3: Permit Intelligence Agent

### Objective
Cross-reference digital Permit-to-Work (PTW) records against active sensor anomalies to identify spatial and temporal conflicts.

### Data Inputs
* **Permit Database:** Active permits (ID, type, zone, authorized workers, duration, last gas test timestamp).
* **Sensor Agent Output:** Active anomalies and gas concentrations.

### Internal Logic
1. **Adjacency Check:** Identifies active permits in adjacent zones that may create risks (e.g. welding next to a gas recovery pipe).
2. **Spatial Conflict Detection:** Detects high-risk task overlaps, such as a hot work permit and a confined space permit active in the same zone simultaneously.
3. **Regulatory Auditing:** Checks if hot work gas re-testing has been performed within the mandatory 30-minute interval (OISD-154 compliance).

### Outputs
* JSON listing permit conflicts, spatial risk multipliers, gas test violations, and specific OISD clauses violated.

---

## 🤖 Agent 4: Compound Risk Agent

### Objective
Correlate all upstream agent outputs (Sensors, Vision, Permits) and historical incident parameters to calculate a unified compound risk score.

### Data Inputs
* Outputs from Sensor Fusion, Vision Analytics, and Permit Intelligence agents.
* Historical incident database (precursor signatures for past incidents like Visakhapatnam 2025).

### Internal Logic
1. **Multi-Factor Correlation:** Evaluates 5 risk components using a weighted scoring model.
2. **Historical Pattern Matching:** Compares current zone precursors with historical signatures. Matches gas drift + hot work permit + shift change to the Visakhapatnam 2025 profile to calculate a similarity percentage.
3. **Risk Level Scaling:** Assigns risk severity levels (Advisory, Warning, Critical, Emergency) based on the combined score.

### Outputs
* JSON listing compound risk scenarios, weighted factor scores, prediction lead time, similarity match percentage, and applicable regulatory references.

---

## 🤖 Agent 5: Emergency Response Agent

### Objective
Orchestrate automated emergency procedures, generate safety recommendations with estimated risk reductions, and trigger evacuation alarms.

### Data Inputs
* Compound Risk Agent output.
* Workforce location tracking data.

### Internal Logic
1. **Recommendation Prioritization:** Selects safety actions targeting the highest-weight risk factors (e.g. shutting down gas valves vs. checking PPE).
2. **Risk Reduction Projection:** Estimates the risk mitigation impact of each recommendation:
   $$\Delta \text{Risk} = \text{Factor\_Score} \times \text{Mitigation\_Factor}$$
3. **Evacuation Decision Logic:** Automatically triggers an evacuation order if the compound risk score in a zone exceeds 70/100.
4. **SCADA Interlock Mapping:** Maps critical risk scores to automated process shutdown actions.

### Outputs
* JSON listing prioritized recommendations, risk reduction percentages, evacuation orders, and SCADA shutdown directives.
