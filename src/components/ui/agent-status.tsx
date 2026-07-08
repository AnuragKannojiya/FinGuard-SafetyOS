'use client';

import { motion } from 'framer-motion';
import { Brain, Eye, FileSearch, Shield, Siren, Radio, Scale, CheckCircle, Loader2, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Agent {
  id: string;
  name: string;
  icon: typeof Brain;
  status: 'active' | 'analyzing' | 'waiting' | 'idle';
  lastAction: string;
  processedCount: number;
  color: string;
}

const AGENTS: Agent[] = [
  { id: 'sensor', name: 'Sensor Fusion Agent', icon: Radio, status: 'active', lastAction: 'Analyzing 31 sensor streams', processedCount: 1247, color: '#22c55e' },
  { id: 'permit', name: 'Permit Intelligence Agent', icon: FileSearch, status: 'active', lastAction: 'Scanning permit conflicts', processedCount: 89, color: '#3b82f6' },
  { id: 'vision', name: 'Vision Analytics Agent', icon: Eye, status: 'active', lastAction: 'PPE compliance check — Zone 3', processedCount: 342, color: '#a855f7' },
  { id: 'risk', name: 'Compound Risk Agent', icon: Brain, status: 'analyzing', lastAction: 'Correlating multi-factor risks', processedCount: 56, color: '#ff6b35' },
  { id: 'compliance', name: 'Compliance Audit Agent', icon: Scale, status: 'active', lastAction: 'OISD-144 standard check', processedCount: 32, color: '#eab308' },
  { id: 'knowledge', name: 'Knowledge & Pattern Agent', icon: Shield, status: 'active', lastAction: 'Cross-referencing incident DB', processedCount: 203, color: '#06b6d4' },
  { id: 'emergency', name: 'Emergency Response Agent', icon: Siren, status: 'waiting', lastAction: 'Standing by — no active emergency', processedCount: 0, color: '#ef4444' },
];

const statusConfig = {
  active: { label: '✓ Active', className: 'bg-risk-low/20 text-risk-low' },
  analyzing: { label: 'Analyzing...', className: 'bg-accent/20 text-accent animate-pulse' },
  waiting: { label: 'Standby', className: 'bg-bg-elevated text-text-muted' },
  idle: { label: 'Idle', className: 'bg-bg-elevated text-text-muted' },
};

export function AgentStatusPanel({ compact = false }: { compact?: boolean }) {
  const [agents, setAgents] = useState(AGENTS);
  const [totalProcessed, setTotalProcessed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents(prev => prev.map(a => {
        const increment = a.status === 'active' ? Math.floor(Math.random() * 3) + 1 :
                         a.status === 'analyzing' ? Math.floor(Math.random() * 5) + 2 : 0;
        // Randomly cycle analyzing status
        let status = a.status;
        if (a.id === 'risk' && Math.random() < 0.15) {
          status = status === 'analyzing' ? 'active' : 'analyzing';
        }
        if (a.id === 'vision' && Math.random() < 0.1) {
          status = status === 'analyzing' ? 'active' : 'analyzing';
        }
        return { ...a, processedCount: a.processedCount + increment, status: status as Agent['status'] };
      }));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setTotalProcessed(agents.reduce((s, a) => s + a.processedCount, 0));
  }, [agents]);

  if (compact) {
    return (
      <div className="glass-card p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">AI Agents</h3>
          <span className="font-mono text-[10px] text-accent">{agents.filter(a => a.status !== 'idle').length}/7 active</span>
        </div>
        <div className="space-y-1.5">
          {agents.map(a => {
            const Icon = a.icon;
            const cfg = statusConfig[a.status];
            return (
              <div key={a.id} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${a.status === 'active' ? 'bg-risk-low' : a.status === 'analyzing' ? 'bg-accent animate-pulse' : 'bg-text-muted'}`} />
                  <Icon className="h-3 w-3" style={{ color: a.color }} />
                  <span className="text-[10px] text-text-secondary truncate max-w-[110px]">{a.name.replace(' Agent', '')}</span>
                </div>
                <span className={`rounded px-1 py-0.5 text-[8px] font-bold ${cfg.className}`}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">SafetyOS AI Agents</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-text-muted">
          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-risk-low" /> {agents.filter(a => a.status === 'active').length} Active</span>
          <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 text-accent animate-spin" /> {agents.filter(a => a.status === 'analyzing').length} Analyzing</span>
          <span className="font-mono text-accent">{totalProcessed.toLocaleString()} ops</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {agents.map((a, i) => {
          const Icon = a.icon;
          const cfg = statusConfig[a.status];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-2.5 rounded-xl bg-bg-elevated/50 p-3 border border-border-subtle"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${a.color}15` }}>
                <Icon className="h-4 w-4" style={{ color: a.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-semibold text-text-primary truncate">{a.name}</span>
                </div>
                <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${cfg.className}`}>{cfg.label}</span>
                <p className="mt-1 text-[10px] text-text-muted truncate">{a.lastAction}</p>
                <p className="mt-0.5 font-mono text-[9px] text-text-muted">{a.processedCount.toLocaleString()} events processed</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
