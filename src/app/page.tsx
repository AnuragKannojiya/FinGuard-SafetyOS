'use client';

import { useSafetyStore } from '@/stores/safety-store';
import { StatCard } from '@/components/ui/stat-card';
import { AgentStatusPanel } from '@/components/ui/agent-status';
import { AIReasoningCard } from '@/components/ui/ai-reasoning';
import { AIDecisionLog, generateLiveDecisionLog } from '@/components/ui/ai-timeline';
import { CCTVPanel } from '@/components/ui/cctv-panel';
import { VizagDemoSimulation } from '@/components/ui/vizag-demo';
import { PipelineTraceViewer } from '@/components/ui/pipeline-trace';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Users, FileCheck, ShieldCheck, Activity,
  TrendingUp, TrendingDown, Minus, Clock, Gauge, Radio, Brain,
} from 'lucide-react';
import { useMemo } from 'react';
import { executePipeline } from '@/lib/ai/agent-pipeline';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusDot = (s: string) =>
  s === 'critical' ? 'bg-risk-critical animate-risk-pulse' :
  s === 'warning' ? 'bg-risk-high' :
  s === 'offline' ? 'bg-text-muted' : 'bg-risk-low';
const statusBadge: Record<string, string> = {
  running: 'bg-risk-low/20 text-risk-low',
  maintenance: 'bg-risk-info/20 text-risk-info',
  alarm: 'bg-risk-critical/20 text-risk-critical animate-alert-flash',
  shutdown: 'bg-text-muted/20 text-text-muted',
  startup: 'bg-risk-medium/20 text-risk-medium',
};
const trendIcon = (t: string) =>
  t === 'rising' ? <TrendingUp className="h-3 w-3 text-risk-critical" /> :
  t === 'falling' ? <TrendingDown className="h-3 w-3 text-risk-low" /> :
  <Minus className="h-3 w-3 text-text-muted" />;

export default function CommandCenter() {
  const stats = useSafetyStore(s => s.stats);
  const plantStatus = useSafetyStore(s => s.plantStatus);
  const alerts = useSafetyStore(s => s.alerts);
  const compoundRisks = useSafetyStore(s => s.compoundRisks);
  const sensorReadings = useSafetyStore(s => s.sensorReadings);
  const processUnits = useSafetyStore(s => s.processUnits);
  const zones = useSafetyStore(s => s.zones);

  const plantStatusColor =
    plantStatus === 'critical' ? 'from-risk-critical/20 to-transparent border-risk-critical/30' :
    plantStatus === 'warning' ? 'from-risk-high/20 to-transparent border-risk-high/30' :
    plantStatus === 'elevated' ? 'from-risk-medium/15 to-transparent border-risk-medium/30' :
    'from-risk-low/10 to-transparent border-risk-low/30';
  const plantDot =
    plantStatus === 'critical' ? 'bg-risk-critical' :
    plantStatus === 'warning' ? 'bg-risk-high' :
    plantStatus === 'elevated' ? 'bg-risk-medium' : 'bg-risk-low';

  const sensorsByZone = useMemo(() => {
    const grouped: Record<string, typeof sensorReadings[string][]> = {};
    Object.values(sensorReadings).forEach(r => {
      if (!grouped[r.zoneId]) grouped[r.zoneId] = [];
      grouped[r.zoneId].push(r);
    });
    return grouped;
  }, [sensorReadings]);

  const decisionLog = useMemo(() => generateLiveDecisionLog(), []);

  // Run the real multi-agent pipeline
  const pipelineResult = useMemo(() => {
    if (Object.keys(sensorReadings).length === 0) return null;
    return executePipeline(
      sensorReadings,
      useSafetyStore.getState().workers,
      useSafetyStore.getState().permits,
      processUnits, zones, compoundRisks,
      useSafetyStore.getState().currentShift
    );
  }, [sensorReadings, processUnits, zones, compoundRisks]);

  // Transform pipeline compound risks into AI reasoning cards
  const aiReasoningCards = useMemo(() => {
    const risks = pipelineResult?.riskAgent.compoundRisks || [];
    return risks.slice(0, 3).map(risk => ({
      title: risk.title,
      riskScore: risk.riskScore,
      confidence: risk.confidence,
      predictionTime: risk.predictionLeadTime,
      severity: risk.severity,
      evidenceChain: risk.factors.map(f => ({
        label: f.name.split('(')[0].trim(),
        value: f.name.includes('(') ? f.name.split('(')[1]?.replace(')', '') || `${f.score}%` : `${f.score}%`,
        status: (f.score > 70 ? 'danger' : f.score > 40 ? 'warning' : 'normal') as 'danger' | 'warning' | 'normal',
      })),
      recommendations: (pipelineResult?.emergencyAgent.recommendations || []).slice(0, 3).map((r, i) => ({
        action: r.action,
        impact: `Risk ↓ ${r.impactPercent}%`,
        priority: i + 1,
      })),
      historicalSimilarity: risk.historicalSimilarity,
      explanation: risk.explanation + (risk.regulations.length > 0
        ? ` Applicable regulations: ${risk.regulations.join('; ')}.`
        : ''),
      formulaBreakdown: risk.factors.map(f => ({
        factor: f.name.slice(0, 30),
        weight: f.weight,
        score: f.score,
      })),
    }));
  }, [pipelineResult]);

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Plant Banner */}
      <motion.div variants={fadeUp} className={`glass-card overflow-hidden border bg-gradient-to-r ${plantStatusColor} p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-4 w-4 rounded-full ${plantDot} animate-pulse-glow shadow-lg`} />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Visakhapatnam Integrated Steel Plant</h1>
              <p className="text-sm text-text-secondary">
                Plant Status: <span className="font-semibold uppercase text-text-primary">{plantStatus}</span>
                <span className="mx-2 text-text-muted">·</span>
                <span className="font-mono text-xs text-text-muted">{stats.totalSensors} sensors · 7 AI agents active</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-risk-low animate-data-flow" />
            <span className="text-xs font-medium text-risk-low">LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* AI Agents Status */}
      <motion.div variants={fadeUp}>
        <AgentStatusPanel />
      </motion.div>

      {/* Pipeline Execution Trace */}
      <motion.div variants={fadeUp}>
        <PipelineTraceViewer />
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Alerts" value={alerts.filter(a => !a.acknowledged).length}
          subtitle={`${alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency').length} critical`}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={alerts.some(a => a.severity === 'critical' || a.severity === 'emergency') ? 'critical' : 'warning'}
          trend="up" trendValue={`+${Math.min(alerts.length, 3)}`} trendLabel="last hour" />
        <StatCard title="Workers On Site" value={stats.workersOnSite}
          subtitle="Across all zones" icon={<Users className="h-5 w-5" />} variant="info" />
        <StatCard title="Active Permits" value={stats.activePermits}
          subtitle="Permit-to-work" icon={<FileCheck className="h-5 w-5" />} variant="default" />
        <StatCard title="Compliance Score" value={`${stats.complianceScore}%`}
          subtitle="OISD / Factory Act / DGMS" icon={<ShieldCheck className="h-5 w-5" />}
          variant="success" trend="up" trendValue="+2.3%" trendLabel="this month" />
      </motion.div>

      {/* AI Reasoning + Decision Log */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div variants={fadeUp} className="xl:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">AI Compound Risk Analysis</h2>
          </div>
          {aiReasoningCards.length === 0 ? (
            <div className="glass-card flex items-center gap-3 p-6 risk-glow-low">
              <div className="h-3 w-3 rounded-full bg-risk-low animate-pulse-glow" />
              <span className="text-sm font-medium text-risk-low">All Clear — No compound risks detected</span>
            </div>
          ) : (
            aiReasoningCards.map((card, i) => <AIReasoningCard key={i} {...card} />)
          )}
        </motion.div>

        <motion.div variants={fadeUp}>
          <AIDecisionLog entries={decisionLog} />
        </motion.div>
      </div>

      {/* Computer Vision */}
      <motion.div variants={fadeUp}>
        <CCTVPanel />
      </motion.div>

      {/* Process Units + Live Sensors */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div variants={fadeUp} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            <Gauge className="mr-2 inline h-4 w-4 text-text-muted" />
            Process Units
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {processUnits.map(unit => (
              <div key={unit.id} className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text-primary truncate">{unit.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusBadge[unit.status] || 'bg-text-muted/20 text-text-muted'}`}>{unit.status}</span>
                </div>
                <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
                  <span>Health</span><span className="font-mono">{unit.health.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${unit.health > 80 ? 'bg-risk-low' : unit.health > 60 ? 'bg-risk-medium' : unit.health > 40 ? 'bg-risk-high' : 'bg-risk-critical'}`}
                    style={{ width: `${unit.health}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            <Radio className="mr-2 inline h-4 w-4 text-risk-low animate-pulse-glow" /> Live Sensor Readings
          </h2>
          <div className="glass-card max-h-[360px] overflow-y-auto p-4">
            <div className="space-y-4">
              {Object.entries(sensorsByZone).slice(0, 8).map(([zoneId, sensors]) => {
                const zone = zones.find(z => z.id === zoneId);
                return (
                  <div key={zoneId}>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{zone?.name || zoneId}</h3>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {sensors.map(s => (
                        <div key={s.sensorId} className="flex items-center gap-2 rounded-lg bg-bg-elevated/50 px-2.5 py-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${statusDot(s.status)}`} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[10px] text-text-muted">{s.type}</p>
                            <p className="font-mono text-xs font-medium text-text-primary">{s.value} <span className="text-text-muted">{s.unit}</span></p>
                          </div>
                          {trendIcon(s.trend)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Visakhapatnam Demo */}
      <motion.div variants={fadeUp}>
        <VizagDemoSimulation />
      </motion.div>
    </motion.div>
  );
}
