'use client';

import { motion } from 'framer-motion';
import { Brain, Radio, Eye, FileSearch, Shield, Siren, Scale, ArrowDown } from 'lucide-react';

interface DecisionEntry {
  time: string;
  agent: string;
  agentIcon: typeof Brain;
  agentColor: string;
  action: string;
  detail?: string;
  riskScore?: number;
  confidence?: number;
}

interface AIDecisionLogProps {
  entries: DecisionEntry[];
  title?: string;
}

const agentIcons: Record<string, { icon: typeof Brain; color: string }> = {
  'Sensor Agent': { icon: Radio, color: '#22c55e' },
  'Vision Agent': { icon: Eye, color: '#a855f7' },
  'Permit Agent': { icon: FileSearch, color: '#3b82f6' },
  'Risk Agent': { icon: Brain, color: '#ff6b35' },
  'Knowledge Agent': { icon: Shield, color: '#06b6d4' },
  'Compliance Agent': { icon: Scale, color: '#eab308' },
  'Emergency Agent': { icon: Siren, color: '#ef4444' },
};

export function AIDecisionLog({ entries, title = 'AI Decision Log' }: AIDecisionLogProps) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-4 w-4 text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">{title}</h3>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-bold text-accent ml-auto">LIVE</span>
      </div>
      <div className="space-y-0">
        {entries.map((entry, i) => {
          const agentInfo = agentIcons[entry.agent] || { icon: Brain, color: '#666' };
          const Icon = agentInfo.icon;
          return (
            <div key={i}>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 py-2"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border-2" style={{ borderColor: agentInfo.color, backgroundColor: `${agentInfo.color}15` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: agentInfo.color }} />
                  </div>
                  {i < entries.length - 1 && (
                    <div className="h-6 w-px" style={{ backgroundColor: `${agentInfo.color}30` }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-text-muted">{entry.time}</span>
                    <span className="text-[10px] font-semibold" style={{ color: agentInfo.color }}>{entry.agent}</span>
                  </div>
                  <p className="text-xs text-text-primary mt-0.5">{entry.action}</p>
                  {entry.detail && (
                    <p className="text-[10px] text-text-muted mt-0.5">{entry.detail}</p>
                  )}
                  {entry.riskScore !== undefined && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-text-muted">Risk Score:</span>
                      <div className="h-1.5 w-20 rounded-full bg-bg-elevated overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${entry.riskScore}%`,
                            backgroundColor: entry.riskScore > 70 ? '#ef4444' : entry.riskScore > 40 ? '#f97316' : '#22c55e',
                          }}
                        />
                      </div>
                      <span className="font-mono text-[10px] font-bold" style={{
                        color: entry.riskScore > 70 ? '#ef4444' : entry.riskScore > 40 ? '#f97316' : '#22c55e',
                      }}>{entry.riskScore}%</span>
                      {entry.confidence && (
                        <span className="text-[9px] text-text-muted">(conf: {entry.confidence}%)</span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Pre-built demo entries for live dashboard
export function generateLiveDecisionLog(): DecisionEntry[] {
  const now = new Date();
  const fmt = (offset: number) => {
    const t = new Date(now.getTime() - offset * 60000);
    return t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  return [
    { time: fmt(8), agent: 'Sensor Agent', agentIcon: Radio, agentColor: '#22c55e', action: 'CH₄ concentration rising in Coke Oven Battery', detail: 'Rate: +0.8 ppm/min — exceeding normal drift', riskScore: 22, confidence: 96 },
    { time: fmt(7), agent: 'Permit Agent', agentIcon: FileSearch, agentColor: '#3b82f6', action: 'Hot work permit PTW-0042 activated', detail: 'Zone: Coke Oven Battery — Welding repair on gas pipeline CKO-2' },
    { time: fmt(6), agent: 'Vision Agent', agentIcon: Eye, agentColor: '#a855f7', action: 'Worker entered without face shield', detail: 'Worker: Yogesh Kumar — PPE violation detected via CCTV-03', confidence: 98 },
    { time: fmt(5), agent: 'Risk Agent', agentIcon: Brain, agentColor: '#ff6b35', action: 'Compound risk detected: Gas + Hot Work + PPE violation', detail: 'Multi-factor correlation triggered', riskScore: 61, confidence: 94 },
    { time: fmt(4), agent: 'Knowledge Agent', agentIcon: Shield, agentColor: '#06b6d4', action: 'Pattern match: 87% similarity to Visakhapatnam 2025 incident', detail: 'Contributing factors: Gas accumulation + maintenance during shift change' },
    { time: fmt(3), agent: 'Risk Agent', agentIcon: Brain, agentColor: '#ff6b35', action: 'Risk escalation: Advisory → Critical', detail: 'Explosion probability revised upward', riskScore: 84, confidence: 91 },
    { time: fmt(2), agent: 'Compliance Agent', agentIcon: Scale, agentColor: '#eab308', action: 'OISD-154 violation: Gas testing not repeated before hot work', detail: 'Standard requires gas test within 30 min of ignition' },
    { time: fmt(1), agent: 'Emergency Agent', agentIcon: Siren, agentColor: '#ef4444', action: 'Pre-emptive evacuation recommended', detail: 'Affected zones: Coke Oven Battery, Gas Recovery Plant', riskScore: 92, confidence: 89 },
  ];
}
