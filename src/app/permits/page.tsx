'use client';

import { useSafetyStore } from '@/stores/safety-store';
import { motion } from 'framer-motion';
import { FileCheck, AlertTriangle, Flame, Wrench, Box, Zap, ArrowUp, Shovel, Clock, Users } from 'lucide-react';
import { useState, useMemo } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

const typeIcons: Record<string, typeof Flame> = {
  'hot-work': Flame, 'cold-work': Wrench, 'confined-space': Box,
  'electrical-isolation': Zap, 'height-work': ArrowUp, 'excavation': Shovel,
};
const typeColor: Record<string, string> = {
  'hot-work': 'text-risk-critical bg-risk-critical/10',
  'cold-work': 'text-risk-info bg-risk-info/10',
  'confined-space': 'text-risk-high bg-risk-high/10',
  'electrical-isolation': 'text-risk-medium bg-risk-medium/10',
  'height-work': 'text-accent bg-accent/10',
  'excavation': 'text-text-secondary bg-bg-elevated',
};
const statusBadge: Record<string, string> = {
  active: 'bg-risk-low/20 text-risk-low', approved: 'bg-risk-info/20 text-risk-info',
  draft: 'bg-bg-elevated text-text-muted', suspended: 'bg-risk-high/20 text-risk-high',
  closed: 'bg-bg-elevated text-text-muted',
};
const riskBadge: Record<string, string> = {
  critical: 'bg-risk-critical/20 text-risk-critical', high: 'bg-risk-high/20 text-risk-high',
  medium: 'bg-risk-medium/20 text-risk-medium', low: 'bg-risk-low/20 text-risk-low',
};

type Tab = 'all' | 'active' | 'conflicts' | 'high-risk';

export default function PermitsPage() {
  const permits = useSafetyStore(s => s.permits);
  const zones = useSafetyStore(s => s.zones);
  const [tab, setTab] = useState<Tab>('all');

  const filtered = useMemo(() => {
    switch (tab) {
      case 'active': return permits.filter(p => p.status === 'active');
      case 'conflicts': return permits.filter(p => p.conflictsWith.length > 0);
      case 'high-risk': return permits.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high');
      default: return permits;
    }
  }, [permits, tab]);

  const activeCount = permits.filter(p => p.status === 'active').length;
  const conflictCount = permits.filter(p => p.conflictsWith.length > 0).length;
  const highRiskCount = permits.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high').length;

  // Conflict pairs (deduplicated)
  const conflictPairs = useMemo(() => {
    const pairs: { a: typeof permits[0]; b: typeof permits[0] }[] = [];
    const seen = new Set<string>();
    permits.filter(p => p.conflictsWith.length > 0).forEach(p => {
      p.conflictsWith.forEach(cid => {
        const key = [p.id, cid].sort().join('-');
        if (!seen.has(key)) {
          seen.add(key);
          const other = permits.find(q => q.id === cid);
          if (other) pairs.push({ a: p, b: other });
        }
      });
    });
    return pairs;
  }, [permits]);

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold tracking-tight">
          <FileCheck className="mr-2 inline h-5 w-5 text-accent" />
          Digital Permit Intelligence
        </h1>
        <p className="mt-1 text-sm text-text-secondary">AI-powered permit conflict detection and spatial analysis</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Total Permits</p>
          <p className="stat-value mt-1 text-3xl font-bold">{permits.length}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Active</p>
          <p className="stat-value mt-1 text-3xl font-bold text-risk-low">{activeCount}</p>
        </div>
        <div className={`glass-card p-4 text-center ${conflictCount > 0 ? 'risk-glow-high' : ''}`}>
          <p className="text-xs uppercase tracking-wider text-text-muted">Conflicts</p>
          <p className="stat-value mt-1 text-3xl font-bold text-risk-high">{conflictCount}</p>
        </div>
        <div className={`glass-card p-4 text-center ${highRiskCount > 0 ? 'risk-glow-critical' : ''}`}>
          <p className="text-xs uppercase tracking-wider text-text-muted">High Risk</p>
          <p className="stat-value mt-1 text-3xl font-bold text-risk-critical">{highRiskCount}</p>
        </div>
      </motion.div>

      {/* Conflict Alerts */}
      {conflictPairs.length > 0 && (
        <motion.div variants={fadeUp} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            <AlertTriangle className="mr-2 inline h-4 w-4 text-risk-high" />
            Spatial Conflicts Detected
          </h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {conflictPairs.slice(0, 4).map(({ a, b }, i) => (
              <div key={i} className="glass-card p-4 risk-glow-high border border-risk-high/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-risk-high mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-risk-high mb-1">PERMIT CONFLICT</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-muted">{a.id}</span>
                        <span className="text-xs text-text-secondary truncate">{a.title}</span>
                      </div>
                      <div className="text-center text-[10px] text-risk-high">⚡ OVERLAPS WITH</div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-muted">{b.id}</span>
                        <span className="text-xs text-text-secondary truncate">{b.title}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-text-muted">
                      Same/adjacent zones: {zones.find(z => z.id === a.zoneId)?.name} ↔ {zones.find(z => z.id === b.zoneId)?.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filter Tabs + Table */}
      <motion.div variants={fadeUp} className="space-y-4">
        <div className="flex gap-2">
          {([['all', 'All', permits.length], ['active', 'Active', activeCount], ['conflicts', 'Conflicts', conflictCount], ['high-risk', 'High Risk', highRiskCount]] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === key ? 'bg-accent/15 text-accent' : 'bg-bg-elevated text-text-muted hover:text-text-secondary'
              }`}
            >
              {label} <span className="ml-1 font-mono">({count})</span>
            </button>
          ))}
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-default bg-bg-elevated/50">
                  <th className="px-4 py-3 font-semibold text-text-muted">ID</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Type</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Title</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Zone</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Risk</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Workers</th>
                  <th className="px-4 py-3 font-semibold text-text-muted">Valid Period</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const Icon = typeIcons[p.type] || FileCheck;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border-subtle hover:bg-bg-hover transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-text-muted">{p.id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor[p.type] || ''}`}>
                          <Icon className="h-3 w-3" />
                          {p.type.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-text-primary">{p.title}</td>
                      <td className="px-4 py-3 text-text-secondary">{zones.find(z => z.id === p.zoneId)?.name || p.zoneId}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusBadge[p.status] || ''}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${riskBadge[p.riskLevel] || ''}`}>
                          {p.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-text-secondary">
                          <Users className="h-3 w-3" /> {p.workers.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-text-muted">
                        {new Date(p.validFrom).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })} —{' '}
                        {new Date(p.validTo).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">No permits match this filter</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
