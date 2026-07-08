'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, CheckCircle, Clock, FileText, ChevronDown, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { useState } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

const standards = [
  { name: 'OISD-144/145', score: 91, total: 9, compliant: 8 },
  { name: 'OISD-154/192', score: 83, total: 6, compliant: 5 },
  { name: 'Factory Act 1948', score: 85, total: 9, compliant: 7 },
  { name: 'DGMS Regulations', score: 88, total: 8, compliant: 7 },
];

const categories = [
  { name: 'Fire Safety', score: 92 }, { name: 'Gas Detection', score: 88 },
  { name: 'PPE', score: 78 }, { name: 'Permit-to-Work', score: 90 },
  { name: 'Emergency Prep', score: 95 }, { name: 'Training', score: 82 },
  { name: 'Equipment Insp.', score: 85 }, { name: 'Electrical Safety', score: 89 },
  { name: 'Structural', score: 91 }, { name: 'Environmental', score: 80 },
];

const deviations = [
  { id: 'D-001', standard: 'OISD-154', title: 'Hydrocarbon detector calibration overdue in Gas Recovery', status: 'non-compliant' as const, priority: 'high', action: 'Schedule immediate calibration with OEM vendor', deadline: '2026-07-15' },
  { id: 'D-002', standard: 'Factory Act', title: 'Safety committee meeting minutes not filed for June', status: 'non-compliant' as const, priority: 'medium', action: 'File meeting minutes with Factory Inspector office', deadline: '2026-07-10' },
  { id: 'D-003', standard: 'DGMS', title: 'Crane load test certificate expiring in 5 days', status: 'partial' as const, priority: 'high', action: 'Arrange third-party load testing by certified agency', deadline: '2026-07-12' },
  { id: 'D-004', standard: 'OISD-145', title: 'Fire water tank level below minimum requirement', status: 'partial' as const, priority: 'critical', action: 'Restore fire water reservoir to minimum 4-hour capacity', deadline: '2026-07-08' },
  { id: 'D-005', standard: 'Factory Act', title: 'PPE training renewal pending for 12 contractors', status: 'non-compliant' as const, priority: 'medium', action: 'Schedule refresher training sessions', deadline: '2026-07-20' },
  { id: 'D-006', standard: 'OISD-192', title: 'Emergency escape route signage faded in Rolling Mill', status: 'partial' as const, priority: 'low', action: 'Replace phosphorescent signage per IS 9457', deadline: '2026-07-30' },
  { id: 'D-007', standard: 'DGMS', title: 'Blasting certificate renewal overdue for Mines section', status: 'non-compliant' as const, priority: 'high', action: 'Apply for renewal with DGMS regional office', deadline: '2026-07-14' },
];

const inspections = [
  { date: '2026-07-15', inspector: 'R.K. Chatterjee (DGFASLI)', scope: 'Annual Factory Inspection', status: 'Scheduled' },
  { date: '2026-07-22', inspector: 'S.N. Pillai (OISD)', scope: 'Fire Safety Audit', status: 'Scheduled' },
  { date: '2026-08-05', inspector: 'Internal Safety Team', scope: 'Monthly Safety Round', status: 'Planned' },
  { date: '2026-08-15', inspector: 'V.K. Sharma (PESO)', scope: 'Pressure Vessel Inspection', status: 'Planned' },
  { date: '2026-09-01', inspector: 'Environmental Board', scope: 'Environmental Compliance Audit', status: 'Planned' },
];

const trendData = [
  { month: 'Aug', score: 72 }, { month: 'Sep', score: 74 }, { month: 'Oct', score: 73 },
  { month: 'Nov', score: 76 }, { month: 'Dec', score: 78 }, { month: 'Jan', score: 79 },
  { month: 'Feb', score: 81 }, { month: 'Mar', score: 80 }, { month: 'Apr', score: 83 },
  { month: 'May', score: 85 }, { month: 'Jun', score: 86 }, { month: 'Jul', score: 87 },
];

const overallScore = 87;
const pBadge: Record<string, string> = { critical: 'bg-risk-critical/20 text-risk-critical', high: 'bg-risk-high/20 text-risk-high', medium: 'bg-risk-medium/20 text-risk-medium', low: 'bg-risk-low/20 text-risk-low' };
const sBadge: Record<string, string> = { 'non-compliant': 'bg-risk-critical/20 text-risk-critical', partial: 'bg-risk-high/20 text-risk-high' };

export default function CompliancePage() {
  const [showReport, setShowReport] = useState(false);

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold tracking-tight">
          <ShieldCheck className="mr-2 inline h-5 w-5 text-accent" />
          Quality & Compliance Audit Agent
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Continuous regulatory monitoring against OISD, Factory Act 1948, and DGMS standards</p>
      </motion.div>

      {/* Score + Standards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Radial Gauge */}
        <div className="glass-card flex flex-col items-center justify-center p-6 lg:col-span-1">
          <div className="relative h-32 w-32">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#1e1e2e" strokeWidth="8" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={overallScore >= 85 ? '#22c55e' : overallScore >= 70 ? '#eab308' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round" strokeDasharray={`${overallScore * 3.14} 314`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="stat-value text-3xl font-bold">{overallScore}%</span>
              <span className="text-[10px] text-text-muted">OVERALL</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-text-muted text-center">32 requirements tracked</p>
        </div>

        {/* Standards Cards */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-4">
          {standards.map(s => (
            <div key={s.name} className="glass-card p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">{s.name}</p>
              <p className="stat-value text-2xl font-bold">{s.score}%</p>
              <div className="mt-2 h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${s.score >= 90 ? 'bg-risk-low' : s.score >= 80 ? 'bg-risk-medium' : 'bg-risk-high'}`} style={{ width: `${s.score}%` }} />
              </div>
              <p className="mt-1.5 text-[10px] text-text-muted">{s.compliant}/{s.total} compliant</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Category Chart */}
        <motion.div variants={fadeUp} className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Compliance by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#666677', fontSize: 10 }} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9999aa', fontSize: 10 }} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="#ff6b35" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Trend Chart */}
        <motion.div variants={fadeUp} className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            <TrendingUp className="mr-1 inline h-3.5 w-3.5 text-risk-low" /> 12-Month Compliance Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="month" tick={{ fill: '#666677', fontSize: 10 }} axisLine={false} />
                <YAxis domain={[60, 100]} tick={{ fill: '#666677', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Deviations */}
      <motion.div variants={fadeUp} className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          <AlertTriangle className="mr-2 inline h-4 w-4 text-risk-high" /> Active Deviations ({deviations.length})
        </h3>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-default bg-bg-elevated/50">
                <th className="px-4 py-3 font-semibold text-text-muted">Standard</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Requirement</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Status</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Priority</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Corrective Action</th>
                <th className="px-4 py-3 font-semibold text-text-muted">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {deviations.map(d => (
                <tr key={d.id} className="border-b border-border-subtle hover:bg-bg-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-text-muted">{d.standard}</td>
                  <td className="px-4 py-3 max-w-[220px] text-text-primary">{d.title}</td>
                  <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${sBadge[d.status]}`}>{d.status}</span></td>
                  <td className="px-4 py-3"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${pBadge[d.priority]}`}>{d.priority}</span></td>
                  <td className="px-4 py-3 max-w-[200px] text-text-secondary">{d.action}</td>
                  <td className="px-4 py-3 font-mono text-text-muted">{d.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Inspections + Report */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div variants={fadeUp} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            <Clock className="mr-2 inline h-4 w-4" /> Upcoming Inspections
          </h3>
          <div className="glass-card p-4 space-y-3">
            {inspections.map((ins, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="text-xs font-medium">{ins.scope}</p>
                  <p className="text-[10px] text-text-muted">{ins.inspector}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-text-secondary">{ins.date}</p>
                  <span className="rounded bg-risk-info/20 px-1.5 py-0.5 text-[10px] font-bold text-risk-info">{ins.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            <FileText className="mr-2 inline h-4 w-4" /> Auto-Audit Report
          </h3>
          <button
            onClick={() => setShowReport(!showReport)}
            className="glass-card w-full p-4 text-left transition-colors hover:bg-bg-hover flex items-center justify-between"
          >
            <span className="text-xs font-medium">Generate Compliance Summary Report</span>
            <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${showReport ? 'rotate-180' : ''}`} />
          </button>
          {showReport && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-4 font-mono text-xs text-text-secondary space-y-2">
              <p className="text-accent font-bold">═══ COMPLIANCE AUDIT SUMMARY ═══</p>
              <p>Report Date: {new Date().toISOString().split('T')[0]}</p>
              <p>Facility: Visakhapatnam Integrated Steel Plant</p>
              <p>Overall Score: {overallScore}% ({overallScore >= 85 ? 'SATISFACTORY' : 'NEEDS IMPROVEMENT'})</p>
              <p className="pt-2">Standards Coverage:</p>
              {standards.map(s => <p key={s.name} className="pl-4">• {s.name}: {s.score}% ({s.compliant}/{s.total})</p>)}
              <p className="pt-2">Active Deviations: {deviations.length}</p>
              <p>Critical Priority: {deviations.filter(d => d.priority === 'critical').length}</p>
              <p className="pt-2 text-text-muted italic">Auto-generated by FinGuard SafetyOS AI Compliance Agent</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
