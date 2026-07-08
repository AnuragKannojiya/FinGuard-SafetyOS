'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, AlertTriangle, Brain, Radio, Eye, FileSearch, Shield, Siren, Scale } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SimStep {
  time: string;
  elapsed: string;
  agent: string;
  agentColor: string;
  event: string;
  detail: string;
  riskScore: number;
  confidence: number;
  type: 'sensor' | 'permit' | 'vision' | 'risk' | 'knowledge' | 'compliance' | 'emergency' | 'outcome';
}

const SCENARIO_STEPS: SimStep[] = [
  { time: 'T-60 min', elapsed: '0s', agent: 'Sensor Agent', agentColor: '#22c55e', event: 'Baseline readings normal', detail: 'CH₄: 4.2 ppm (normal range: 0-10 ppm). All 31 sensors within operating parameters.', riskScore: 8, confidence: 99, type: 'sensor' },
  { time: 'T-55 min', elapsed: '5s', agent: 'Permit Agent', agentColor: '#3b82f6', event: 'Hot work permit PTW-0042 activated', detail: 'Welding repair on Coke Oven gas pipeline CKO-2. 4 maintenance workers assigned.', riskScore: 12, confidence: 97, type: 'permit' },
  { time: 'T-47 min', elapsed: '10s', agent: 'Sensor Agent', agentColor: '#22c55e', event: 'CH₄ drift detected', detail: 'CH₄ rising to 8.7 ppm at +0.3 ppm/min. Rate exceeds normal operational drift of ±0.1 ppm/min.', riskScore: 22, confidence: 96, type: 'sensor' },
  { time: 'T-42 min', elapsed: '15s', agent: 'Risk Agent', agentColor: '#ff6b35', event: '⚡ COMPOUND RISK: Gas + Hot Work', detail: 'Correlating: Rising CH₄ in Coke Oven Battery + Active hot work permit with ignition source. Individual sensors below warning — compound analysis triggers ADVISORY.', riskScore: 34, confidence: 94, type: 'risk' },
  { time: 'T-38 min', elapsed: '20s', agent: 'Vision Agent', agentColor: '#a855f7', event: 'PPE violation detected', detail: 'CCTV-03: Worker Yogesh Kumar entered zone without face shield. Gas mask not worn despite elevated CH₄ zone classification.', riskScore: 41, confidence: 98, type: 'vision' },
  { time: 'T-35 min', elapsed: '25s', agent: 'Knowledge Agent', agentColor: '#06b6d4', event: 'Pattern match: Visakhapatnam 2025', detail: 'Historical analysis: Current conditions match 73% of precursors from the January 2025 Coke Oven explosion. Key overlap: gas accumulation + maintenance activity + inadequate PPE.', riskScore: 52, confidence: 91, type: 'knowledge' },
  { time: 'T-30 min', elapsed: '30s', agent: 'Risk Agent', agentColor: '#ff6b35', event: '⚠ RISK ESCALATION: Advisory → Warning', detail: 'Compound score breached 50. Three concurrent risk factors: gas level (35%) + hot work permit (25%) + PPE violation (15%) + historical pattern (25%) = 52/100. Shift changeover in 30 min adds temporal risk.', riskScore: 58, confidence: 92, type: 'risk' },
  { time: 'T-27 min', elapsed: '35s', agent: 'Compliance Agent', agentColor: '#eab308', event: 'OISD-154 violation flagged', detail: 'Gas testing not repeated within 30 min before hot work ignition per OISD Standard 154, Section 4.3.2. Last gas test was 45 min ago.', riskScore: 63, confidence: 95, type: 'compliance' },
  { time: 'T-23 min', elapsed: '40s', agent: 'Sensor Agent', agentColor: '#22c55e', event: 'CH₄ crosses warning threshold', detail: 'CH₄ at 14.8 ppm — WARNING level. Rate accelerated to +0.6 ppm/min. Trend projection: critical threshold (25 ppm) in ~17 minutes.', riskScore: 71, confidence: 97, type: 'sensor' },
  { time: 'T-20 min', elapsed: '45s', agent: 'Risk Agent', agentColor: '#ff6b35', event: '🚨 RISK ESCALATION: Warning → Critical', detail: 'Compound score: 78/100. Explosion probability: 84%. PREDICTED: Threshold breach in ~17 min at current gas trajectory. All 5 risk factors active simultaneously.', riskScore: 84, confidence: 93, type: 'risk' },
  { time: 'T-18 min', elapsed: '50s', agent: 'Risk Agent', agentColor: '#ff6b35', event: '📊 AI Recommendation generated', detail: 'Priority 1: Suspend permit PTW-0042 (impact: -42% risk). Priority 2: Evacuate Coke Oven Battery (impact: -31% risk). Priority 3: Activate emergency ventilation (gas ↓ in 4 min). Priority 4: Notify Chief Safety Officer.', riskScore: 84, confidence: 93, type: 'risk' },
  { time: 'T-15 min', elapsed: '55s', agent: 'Emergency Agent', agentColor: '#ef4444', event: '🚨 PRE-EMPTIVE EVACUATION INITIATED', detail: 'Auto-triggered: Evacuation of Coke Oven Battery + Gas Recovery Plant. Fire brigade alerted. SCADA auto-shutdown of CKO-2 process unit. All 4 maintenance workers + 12 operators ordered to muster point.', riskScore: 92, confidence: 89, type: 'emergency' },
  { time: 'T-12 min', elapsed: '60s', agent: 'Emergency Agent', agentColor: '#ef4444', event: 'Zone cleared — all personnel evacuated', detail: '16 workers confirmed at muster point. Gas ventilation activated. CH₄ levels beginning to decline. SCADA shows CKO-2 fully shutdown.', riskScore: 65, confidence: 94, type: 'emergency' },
  { time: 'T-0 min', elapsed: '65s', agent: 'Sensor Agent', agentColor: '#22c55e', event: 'CH₄ peaked at 28.3 ppm — EXPLOSION THRESHOLD', detail: 'Gas peaked and began declining due to ventilation. Zone was EMPTY. Without SafetyOS evacuation at T-15 min, 8+ workers would have been in the blast zone.', riskScore: 35, confidence: 99, type: 'outcome' },
  { time: 'T+5 min', elapsed: '70s', agent: 'Knowledge Agent', agentColor: '#06b6d4', event: '✅ INCIDENT PREVENTED — Zero casualties', detail: 'SafetyOS detected compound risk 47 minutes before explosion threshold. Autonomous evacuation completed 15 minutes before peak. Preliminary DGFASLI report auto-generated. All sensor evidence preserved for investigation.', riskScore: 8, confidence: 99, type: 'outcome' },
];

export function VizagDemoSimulation() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startSimulation = useCallback(() => {
    setIsRunning(true);
    setCurrentStep(0);
    setIsComplete(false);
  }, []);

  const resetSimulation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
    setCurrentStep(-1);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (!isRunning || currentStep < 0) return;
    if (currentStep >= SCENARIO_STEPS.length) {
      setIsComplete(true);
      setIsRunning(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, currentStep === 0 ? 1500 : 3500);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isRunning, currentStep]);

  const visibleSteps = SCENARIO_STEPS.slice(0, Math.max(0, currentStep));
  const latestRisk = visibleSteps.length > 0 ? visibleSteps[visibleSteps.length - 1].riskScore : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden border border-accent/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/10 to-transparent p-4 border-b border-accent/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">🏭 Visakhapatnam 2025 — Live Scenario Replay</h3>
              <p className="text-[10px] text-text-muted">Watch SafetyOS detect and prevent the Coke Oven Battery explosion in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isRunning && !isComplete && (
              <button
                onClick={startSimulation}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent/90 transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                <Play className="h-4 w-4" /> {currentStep > 0 ? 'Resume' : 'Start Simulation'}
              </button>
            )}
            {isRunning && (
              <button
                onClick={() => setIsRunning(false)}
                className="flex items-center gap-2 rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text-secondary hover:bg-bg-hover transition-colors"
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            {(currentStep > 0 || isComplete) && (
              <button onClick={resetSimulation} className="rounded-lg bg-bg-elevated p-2 text-text-muted hover:text-text-primary transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Risk Progress */}
        {currentStep >= 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[10px] font-medium text-text-muted w-16">Risk Level</span>
            <div className="flex-1 h-3 rounded-full bg-bg-elevated overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${latestRisk}%`,
                  backgroundColor: latestRisk > 70 ? '#ef4444' : latestRisk > 40 ? '#f97316' : latestRisk > 20 ? '#eab308' : '#22c55e',
                }}
                animate={{ width: `${latestRisk}%` }}
              />
            </div>
            <span className="font-mono text-sm font-bold w-10 text-right" style={{
              color: latestRisk > 70 ? '#ef4444' : latestRisk > 40 ? '#f97316' : latestRisk > 20 ? '#eab308' : '#22c55e',
            }}>{latestRisk}%</span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="max-h-[500px] overflow-y-auto p-4">
        {currentStep < 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-accent/30 mb-3" />
            <p className="text-sm text-text-secondary">Press <strong className="text-accent">Start Simulation</strong> to replay the January 2025 incident</p>
            <p className="text-xs text-text-muted mt-1">Watch 7 AI agents detect compound risk 47 minutes before the explosion threshold</p>
          </div>
        ) : (
          <div className="space-y-0">
            {visibleSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-3 py-2.5"
              >
                <div className="flex flex-col items-center shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2" style={{ borderColor: step.agentColor, backgroundColor: `${step.agentColor}15` }}>
                    {step.type === 'sensor' ? <Radio className="h-4 w-4" style={{ color: step.agentColor }} /> :
                     step.type === 'permit' ? <FileSearch className="h-4 w-4" style={{ color: step.agentColor }} /> :
                     step.type === 'vision' ? <Eye className="h-4 w-4" style={{ color: step.agentColor }} /> :
                     step.type === 'risk' ? <Brain className="h-4 w-4" style={{ color: step.agentColor }} /> :
                     step.type === 'knowledge' ? <Shield className="h-4 w-4" style={{ color: step.agentColor }} /> :
                     step.type === 'compliance' ? <Scale className="h-4 w-4" style={{ color: step.agentColor }} /> :
                     step.type === 'emergency' ? <Siren className="h-4 w-4" style={{ color: step.agentColor }} /> :
                     <Brain className="h-4 w-4" style={{ color: step.agentColor }} />}
                  </div>
                  {i < visibleSteps.length - 1 && <div className="h-8 w-px" style={{ backgroundColor: `${step.agentColor}30` }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-accent">{step.time}</span>
                    <span className="text-[10px] font-bold" style={{ color: step.agentColor }}>{step.agent}</span>
                    <span className="text-[9px] text-text-muted">conf: {step.confidence}%</span>
                  </div>
                  <p className="text-xs font-semibold text-text-primary mt-0.5">{step.event}</p>
                  <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{step.detail}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-bg-elevated overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{
                        width: `${step.riskScore}%`,
                        backgroundColor: step.riskScore > 70 ? '#ef4444' : step.riskScore > 40 ? '#f97316' : step.riskScore > 20 ? '#eab308' : '#22c55e',
                      }} />
                    </div>
                    <span className="font-mono text-[10px] font-bold" style={{
                      color: step.riskScore > 70 ? '#ef4444' : step.riskScore > 40 ? '#f97316' : step.riskScore > 20 ? '#eab308' : '#22c55e',
                    }}>Risk: {step.riskScore}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
            {isRunning && currentStep < SCENARIO_STEPS.length && (
              <div className="flex items-center gap-3 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 animate-pulse">
                  <Brain className="h-4 w-4 text-accent" />
                </div>
                <span className="text-xs text-accent animate-pulse">AI agents analyzing...</span>
              </div>
            )}
          </div>
        )}

        {/* Completion */}
        {isComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 rounded-xl bg-risk-low/10 border border-risk-low/20 p-4 text-center">
            <p className="text-sm font-bold text-risk-low mb-1">✅ INCIDENT PREVENTED — Zero Casualties</p>
            <p className="text-xs text-text-secondary">SafetyOS detected compound risk <strong className="text-accent">47 minutes</strong> before explosion threshold and evacuated all personnel <strong className="text-accent">15 minutes</strong> before the gas peak.</p>
            <p className="text-[10px] text-text-muted mt-2">In the actual January 2025 incident, 8 workers died because no intelligence layer connected the sensor readings to operational decisions.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
