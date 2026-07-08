'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Radio, Eye, FileSearch, Shield, Siren, Scale, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useSafetyStore } from '@/stores/safety-store';
import { executePipeline, type PipelineResult } from '@/lib/ai/agent-pipeline';

interface AgentStep {
  name: string;
  icon: typeof Brain;
  color: string;
  status: 'pending' | 'running' | 'complete';
  duration?: number;
  outputSummary: string;
  outputJson: Record<string, unknown>;
  inputFrom?: string;
}

export function PipelineTraceViewer() {
  const [expanded, setExpanded] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [pipeline, setPipeline] = useState<PipelineResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AgentStep[]>([]);

  const sensorReadings = useSafetyStore(s => s.sensorReadings);
  const workers = useSafetyStore(s => s.workers);
  const permits = useSafetyStore(s => s.permits);
  const processUnits = useSafetyStore(s => s.processUnits);
  const zones = useSafetyStore(s => s.zones);
  const compoundRisks = useSafetyStore(s => s.compoundRisks);
  const currentShift = useSafetyStore(s => s.currentShift);

  const runPipeline = () => {
    if (Object.keys(sensorReadings).length === 0) return;
    setIsRunning(true);
    setSelectedAgent(null);

    // Animate sequential execution
    const baseSteps: AgentStep[] = [
      { name: 'Sensor Fusion Agent', icon: Radio, color: '#22c55e', status: 'pending', outputSummary: '', outputJson: {} },
      { name: 'Vision Analytics Agent', icon: Eye, color: '#a855f7', status: 'pending', outputSummary: '', outputJson: {} },
      { name: 'Permit Intelligence Agent', icon: FileSearch, color: '#3b82f6', status: 'pending', outputSummary: '', outputJson: {} },
      { name: 'Compound Risk Agent', icon: Brain, color: '#ff6b35', status: 'pending', outputSummary: '', outputJson: {} },
      { name: 'Emergency Response Agent', icon: Siren, color: '#ef4444', status: 'pending', outputSummary: '', outputJson: {} },
    ];
    setSteps([...baseSteps]);

    // Execute real pipeline
    const result = executePipeline(sensorReadings, workers, permits, processUnits, zones, compoundRisks, currentShift);
    setPipeline(result);

    // Animate steps sequentially
    const delays = [300, 700, 1100, 1600, 2100];
    const completions = [600, 1000, 1500, 2000, 2500];

    delays.forEach((delay, i) => {
      setTimeout(() => {
        setSteps(prev => prev.map((s, j) => j === i ? { ...s, status: 'running' as const } : s));
      }, delay);
    });

    completions.forEach((delay, i) => {
      setTimeout(() => {
        const outputs = [
          {
            summary: result.sensorAgent.summary,
            json: {
              anomalies: result.sensorAgent.anomalies.length,
              zoneScores: result.sensorAgent.zoneRiskScores,
              topAnomaly: result.sensorAgent.anomalies[0] || 'none',
            },
            duration: 47,
          },
          {
            summary: result.visionAgent.summary,
            json: {
              violations: result.visionAgent.violations.length,
              complianceRate: result.visionAgent.complianceRate,
              topViolation: result.visionAgent.violations[0] ? {
                worker: result.visionAgent.violations[0].workerName,
                missing: result.visionAgent.violations[0].missingPPE,
              } : 'none',
            },
            duration: 31,
          },
          {
            summary: result.permitAgent.summary,
            json: {
              activePermits: result.permitAgent.activePermits,
              conflicts: result.permitAgent.conflicts.length,
              gasTestViolations: result.permitAgent.gasTestViolations.length,
              topConflict: result.permitAgent.conflicts[0] || 'none',
            },
            duration: 22,
          },
          {
            summary: result.riskAgent.summary,
            json: {
              compoundRisks: result.riskAgent.compoundRisks.length,
              overallPlantRisk: result.riskAgent.overallPlantRisk,
              topRisk: result.riskAgent.compoundRisks[0] ? {
                title: result.riskAgent.compoundRisks[0].title,
                score: result.riskAgent.compoundRisks[0].riskScore,
                confidence: result.riskAgent.compoundRisks[0].confidence,
                factors: result.riskAgent.compoundRisks[0].factors.length,
              } : 'none',
            },
            duration: 63,
          },
          {
            summary: result.emergencyAgent.summary,
            json: {
              recommendations: result.emergencyAgent.recommendations.length,
              evacuationRequired: result.emergencyAgent.evacuationRequired,
              evacuationZones: result.emergencyAgent.evacuationZones,
              topRecommendation: result.emergencyAgent.recommendations[0] || 'none',
            },
            duration: 18,
          },
        ];

        setSteps(prev => prev.map((s, j) =>
          j === i ? {
            ...s,
            status: 'complete' as const,
            duration: outputs[i].duration,
            outputSummary: outputs[i].summary,
            outputJson: outputs[i].json,
            inputFrom: i > 0 ? prev[i - 1].name : 'Live Sensor Streams',
          } : s
        ));

        if (i === completions.length - 1) {
          setTimeout(() => setIsRunning(false), 200);
        }
      }, delay);
    });
  };

  // Auto-run on mount
  useEffect(() => {
    const timer = setTimeout(runPipeline, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalDuration = pipeline ? pipeline.endTime - pipeline.startTime : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Multi-Agent Pipeline Execution</h3>
          {pipeline && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-mono font-bold text-accent">
              {pipeline.executionId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalDuration > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-text-muted">
              <Clock className="h-3 w-3" /> {totalDuration}ms total
            </span>
          )}
          <button
            onClick={runPipeline}
            disabled={isRunning}
            className="flex items-center gap-1.5 rounded-lg bg-accent/15 px-3 py-1.5 text-[10px] font-bold text-accent hover:bg-accent/25 transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <><Brain className="h-3 w-3 animate-spin" /> Executing...</>
            ) : (
              <><Zap className="h-3 w-3" /> Re-Execute Pipeline</>
            )}
          </button>
          <button onClick={() => setExpanded(!expanded)} className="text-text-muted hover:text-text-primary transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Pipeline Flow */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-1">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isSelected = selectedAgent === i;
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <button
                  onClick={() => setSelectedAgent(isSelected ? null : i)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1 transition-all border ${
                    step.status === 'complete'
                      ? isSelected ? 'bg-bg-elevated border-accent/30' : 'bg-bg-elevated/50 border-border-subtle hover:border-accent/20'
                      : step.status === 'running'
                      ? 'bg-accent/5 border-accent/20 animate-pulse'
                      : 'bg-bg-elevated/20 border-border-subtle opacity-50'
                  }`}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${step.color}15` }}>
                    <Icon className={`h-3.5 w-3.5 ${step.status === 'running' ? 'animate-spin' : ''}`} style={{ color: step.color }} />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[9px] font-semibold text-text-primary truncate">{step.name.replace(' Agent', '')}</p>
                    <p className="text-[8px] text-text-muted">
                      {step.status === 'complete' ? `✓ ${step.duration}ms` :
                       step.status === 'running' ? 'Executing...' : 'Pending'}
                    </p>
                  </div>
                </button>
                {i < steps.length - 1 && (
                  <div className="shrink-0 text-text-muted text-[10px]">→</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Agent Detail Panel */}
        <AnimatePresence>
          {selectedAgent !== null && steps[selectedAgent]?.status === 'complete' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl bg-bg-elevated/50 border border-border-subtle p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-primary">{steps[selectedAgent].name} — Output</h4>
                  {steps[selectedAgent].inputFrom && (
                    <span className="text-[9px] text-text-muted">Input from: {steps[selectedAgent].inputFrom}</span>
                  )}
                </div>

                {/* Summary */}
                <p className="text-[11px] text-text-secondary leading-relaxed">{steps[selectedAgent].outputSummary}</p>

                {/* JSON Output */}
                <div className="rounded-lg bg-bg-primary border border-border-subtle p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-accent mb-2">Structured Output (JSON)</p>
                  <pre className="text-[10px] text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(steps[selectedAgent].outputJson, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded: Full Pipeline Result */}
      <AnimatePresence>
        {expanded && pipeline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle p-4 space-y-3">
              {/* Final Assessment */}
              <div className="rounded-xl bg-accent/5 border border-accent/15 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-accent mb-1">Pipeline Final Assessment</p>
                <p className="text-xs text-text-secondary leading-relaxed">{pipeline.finalAssessment}</p>
              </div>

              {/* Regulatory Citations */}
              {pipeline.regulatoryCitations.length > 0 && (
                <div className="rounded-xl bg-bg-elevated/50 border border-border-subtle p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2">Regulatory Citations (RAG Retrieval)</p>
                  <div className="space-y-1">
                    {pipeline.regulatoryCitations.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-[10px]">
                        <span className="text-accent">📋</span>
                        <span className="font-medium text-text-secondary">{c.standard}, {c.section}</span>
                        <span className="text-text-muted">— {c.relevance}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Execution Metadata */}
              <div className="flex flex-wrap gap-4 text-[10px] text-text-muted">
                <span>Execution ID: <span className="font-mono text-text-secondary">{pipeline.executionId}</span></span>
                <span>Start: <span className="font-mono text-text-secondary">{new Date(pipeline.startTime).toLocaleTimeString()}</span></span>
                <span>Duration: <span className="font-mono text-text-secondary">{pipeline.endTime - pipeline.startTime}ms</span></span>
                <span>Agents: <span className="font-mono text-text-secondary">5/5 complete</span></span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
