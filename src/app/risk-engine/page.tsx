'use client';

import { useSafetyStore } from '@/stores/safety-store';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Clock, Users, ChevronDown, ChevronUp, Zap, Brain } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useState } from 'react';
import { RiskPredictionGraph } from '@/components/ui/risk-prediction';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const sevColor: Record<string, string> = { emergency: '#ef4444', critical: '#ef4444', warning: '#f97316', advisory: '#eab308' };
const sevBadge: Record<string, string> = {
  emergency: 'bg-risk-critical text-white animate-alert-flash',
  critical: 'bg-risk-critical/90 text-white',
  warning: 'bg-risk-high/90 text-white',
  advisory: 'bg-risk-medium/90 text-black',
};
const sevGlow: Record<string, string> = { emergency: 'risk-glow-critical', critical: 'risk-glow-critical', warning: 'risk-glow-high', advisory: 'risk-glow-medium' };

const factorIcon: Record<string, string> = {
  'gas-level': '🔥', 'permit-conflict': '📋', 'worker-density': '👷', 'equipment-status': '⚙️',
  'shift-timing': '🕐', 'weather': '🌧️', 'maintenance-gap': '🔧', 'ppe-violation': '🦺',
};

export default function RiskEnginePage() {
  const compoundRisks = useSafetyStore(s => s.compoundRisks);
  const zones = useSafetyStore(s => s.zones);
  const [expanded, setExpanded] = useState<string | null>(null);

  const critCount = compoundRisks.filter(r => r.severity === 'critical' || r.severity === 'emergency').length;
  const avgLead = compoundRisks.length > 0 ? Math.round(compoundRisks.reduce((s, r) => s + r.predictionLeadTime, 0) / compoundRisks.length) : 0;
  const totalWorkers = compoundRisks.reduce((s, r) => s + r.affectedWorkers, 0);

  // Pie chart data
  const dist = ['emergency', 'critical', 'warning', 'advisory'].map(sev => ({
    name: sev, value: compoundRisks.filter(r => r.severity === sev).length,
  })).filter(d => d.value > 0);

  // Factor frequency matrix
  const factorTypes = ['gas-level', 'permit-conflict', 'worker-density', 'equipment-status', 'shift-timing', 'ppe-violation', 'maintenance-gap'];
  const factorFreq = factorTypes.map(t => ({
    type: t,
    count: compoundRisks.reduce((s, r) => s + r.contributingFactors.filter(f => f.type === t).length, 0),
  }));

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold tracking-tight">
          <Zap className="mr-2 inline h-5 w-5 text-accent" />
          Compound Risk Detection Engine
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Multi-factor correlation of gas levels, permits, worker density, equipment state, and shift timing
        </p>
      </motion.div>

      {/* Risk Prediction Graph */}
      <motion.div variants={fadeUp}>
        <RiskPredictionGraph />
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Active Risks</p>
          <p className="stat-value mt-1 text-3xl font-bold text-text-primary">{compoundRisks.length}</p>
        </div>
        <div className={`glass-card p-4 text-center ${critCount > 0 ? 'risk-glow-critical' : ''}`}>
          <p className="text-xs uppercase tracking-wider text-text-muted">Critical / Emergency</p>
          <p className="stat-value mt-1 text-3xl font-bold text-risk-critical">{critCount}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Avg Lead Time</p>
          <p className="stat-value mt-1 text-3xl font-bold text-accent">{avgLead}<span className="text-lg text-text-muted"> min</span></p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Workers at Risk</p>
          <p className="stat-value mt-1 text-3xl font-bold text-risk-high">{totalWorkers}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Risk Cards */}
        <motion.div variants={fadeUp} className="xl:col-span-2 space-y-4">
          {compoundRisks.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16 risk-glow-low">
              <Shield className="h-16 w-16 text-risk-low mb-4" />
              <h3 className="text-lg font-bold text-risk-low">All Clear</h3>
              <p className="text-sm text-text-muted mt-1">No compound risks detected — all factor combinations within safe limits</p>
            </div>
          ) : (
            compoundRisks.map((risk, i) => {
              const isExpanded = expanded === risk.id;
              return (
                <motion.div
                  key={risk.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`glass-card overflow-hidden ${sevGlow[risk.severity]}`}
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : risk.id)}
                    className="flex w-full items-start justify-between p-4 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${sevBadge[risk.severity]}`}>
                          {risk.severity}
                        </span>
                        <span className="text-sm font-semibold truncate">{risk.title}</span>
                      </div>
                      <p className="text-xs text-text-muted line-clamp-1">{risk.description}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-2xl font-bold text-accent">~{risk.predictionLeadTime}</div>
                        <div className="text-[9px] uppercase tracking-wider text-text-muted">min lead time</div>
                      </div>
                      {/* Score Ring */}
                      <div className="relative h-14 w-14">
                        <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="#1e1e2e" strokeWidth="4" />
                          <circle cx="28" cy="28" r="22" fill="none"
                            stroke={sevColor[risk.severity] || '#eab308'}
                            strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={`${risk.compoundScore * 1.382} 138.2`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">
                          {Math.round(risk.compoundScore)}
                        </span>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-border-subtle"
                    >
                      <div className="p-4 space-y-4">
                        {/* Contributing Factors */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Contributing Factors</h4>
                          <div className="space-y-2">
                            {risk.contributingFactors.map((f, fi) => (
                              <div key={fi} className="flex items-center gap-3">
                                <span className="text-sm">{factorIcon[f.type] || '⚠️'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-text-secondary truncate">{f.description}</span>
                                    <span className="font-mono text-[10px] text-text-muted shrink-0 ml-2">
                                      w:{(f.weight * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                                    <div
                                      className="h-full rounded-full bg-accent transition-all duration-500"
                                      style={{ width: `${Math.min(100, (f.value / Math.max(f.threshold, 1)) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Zones */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Affected Zones</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {risk.affectedZones.map(z => (
                              <span key={z} className="rounded-full bg-bg-elevated px-3 py-1 text-xs font-medium text-text-secondary">
                                {zones.find(zone => zone.id === z)?.name || z}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Recommended Actions</h4>
                          <ol className="space-y-1 list-decimal list-inside">
                            {risk.recommendedActions.map((a, ai) => (
                              <li key={ai} className="text-xs text-text-secondary">{a}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </motion.div>

        {/* Right Column */}
        <motion.div variants={fadeUp} className="space-y-6">
          {/* Pie Chart */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Risk Distribution</h3>
            {dist.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-sm text-text-muted">No active risks</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dist} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                      {dist.map(d => (
                        <Cell key={d.name} fill={sevColor[d.name] || '#666'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {['emergency', 'critical', 'warning', 'advisory'].map(s => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ background: sevColor[s] }} />
                  <span className="text-[10px] uppercase text-text-muted">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Factor Matrix */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Risk Factor Frequency</h3>
            <div className="space-y-2">
              {factorFreq.sort((a, b) => b.count - a.count).map(f => (
                <div key={f.type} className="flex items-center gap-3">
                  <span className="text-sm">{factorIcon[f.type] || '⚠️'}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-text-secondary capitalize">{f.type.replace(/-/g, ' ')}</span>
                      <span className="font-mono text-[11px] text-text-muted">{f.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-bg-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent/70"
                        style={{ width: `${Math.min(100, (f.count / Math.max(1, ...factorFreq.map(x => x.count))) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
