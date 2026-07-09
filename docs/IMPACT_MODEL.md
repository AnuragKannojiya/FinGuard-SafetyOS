# 📊 FinGuard SafetyOS — Risk Impact & Calculation Model

This document outlines the mathematical models, formulas, and factor weights used by the Compound Risk Engine in SafetyOS.

---

## 1. Compound Risk Calculation
SafetyOS uses an explainable weighted correlation index instead of uninterpretable machine learning neural nets for its primary alarm state logic, guaranteeing 100% compliance traceability.

The compound score for each plant zone is calculated as:

$$\text{Compound Risk Score} = \text{Min}\left(100, \frac{\sum_{i=1}^{n} (\text{Score}_i \times \text{Weight}_i)}{\sum_{i=1}^{n} \text{Weight}_i}\right)$$

---

## 2. Factor Definitions & Scoring Weights

### A. Gas Telemetry ($Weight = 35\%$)
Determined by the Sensor Fusion Agent based on the rate of gas concentration change over time:

$$\text{Gas Score} = \text{Min}\left(100, \text{Base\_Score} + \left(\frac{dC}{dt} \times \text{Telemetry\_Drift\_Factor}\right)\right)$$

*Where:*
* $\text{Base\_Score}$ represents the percentage deviation of gas concentration from the normal baseline.
* $\frac{dC}{dt}$ represents the gas accumulation velocity (ppm/min).

### B. Permit Proximity Conflicts ($Weight = 25\%$)
Derived by the Permit Intelligence Agent:
- If a Hot Work Permit overlaps with a flammable/toxic zone containing active gas warnings: $\text{Score} = 80\%$.
- If a Confined Space Permit overlaps with adjacent hot work operations: $\text{Score} = 75\%$.
- Otherwise: $\text{Score} = \text{Active\_Permits\_Count} \times 15\%$.

### C. PPE Compliance ($Weight = 15\%$)
Calculated from CCTV computer vision analytics:

$$\text{PPE Score} = 100 - \text{Compliance\_Rate}$$

*Where:*
* $\text{Compliance\_Rate}$ is the percentage of workers within the zone wearing all mandatory safety gear (Helmets, face shields, gloves).

### D. Shift Handover Windows ($Weight = 10\%$)
Accounts for temporal risk factors during supervisor changeovers:
- During shift transitions ($\pm 15$ minutes of shift changes): $\text{Score} = 55\%$.
- Outside transition windows: $\text{Score} = 0\%$.

### E. Historical Pattern Similarity ($Weight = 15\%$)
Evaluated by matching current parameters (zone classification, active permit types, gas drift rate) against precursors in the historical disaster database:

$$\text{Similarity Score} = \text{Match\_Percentage}$$

---

## 3. Threat Action Matrix

Based on the calculated Compound Risk Score, the Emergency Response Agent triggers appropriate actions:

| Risk Score | Threat Level | Visual Indicator | SCADA Action | Recommended Operational Protocol |
| :---: | :--- | :---: | :--- | :--- |
| **0% – 35%** | **Low / Normal** | Green | Standard process flow | Routine monitoring. |
| **36% – 55%** | **Warning** | Yellow | Issue safety advisory | Repeat gas testing intervals, verify permit clearances. |
| **56% – 70%** | **Critical** | Orange | SCADA interlock standby | Suspend active hot work permits, evacuate non-essential staff. |
| **71% – 100%** | **Emergency** | Red | **SCADA Auto-Shutdown (ESD)** | **Immediate evacuation of all zone personnel to muster points.** |
