'use client';

import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, BarChart3, Clock, Shield, Skull, Target, Star } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };

// Monthly trend data (3 years)
const monthlyTrend = [
  { month: 'Jan 23', total: 18, severe: 4, nearMiss: 8 }, { month: 'Apr 23', total: 15, severe: 3, nearMiss: 7 },
  { month: 'Jul 23', total: 22, severe: 5, nearMiss: 10 }, { month: 'Oct 23', total: 14, severe: 2, nearMiss: 6 },
  { month: 'Jan 24', total: 16, severe: 3, nearMiss: 7 }, { month: 'Apr 24', total: 13, severe: 2, nearMiss: 6 },
  { month: 'Jul 24', total: 19, severe: 4, nearMiss: 9 }, { month: 'Oct 24', total: 12, severe: 2, nearMiss: 5 },
  { month: 'Jan 25', total: 14, severe: 3, nearMiss: 6 }, { month: 'Apr 25', total: 10, severe: 1, nearMiss: 5 },
  { month: 'Jul 25', total: 11, severe: 1, nearMiss: 5 }, { month: 'Oct 25', total: 8, severe: 1, nearMiss: 4 },
];

// By hour
const hourlyData = [
  { hour: '00', count: 2 }, { hour: '02', count: 1 }, { hour: '04', count: 2 }, { hour: '06', count: 8 },
  { hour: '07', count: 7 }, { hour: '08', count: 4 }, { hour: '10', count: 3 }, { hour: '12', count: 2 },
  { hour: '14', count: 9 }, { hour: '15', count: 6 }, { hour: '16', count: 3 }, { hour: '18', count: 2 },
  { hour: '20', count: 2 }, { hour: '22', count: 5 }, { hour: '23', count: 3 },
];

// By day
const dailyData = [
  { day: 'Mon', count: 28 }, { day: 'Tue', count: 22 }, { day: 'Wed', count: 18 },
  { day: 'Thu', count: 20 }, { day: 'Fri', count: 24 }, { day: 'Sat', count: 15 }, { day: 'Sun', count: 8 },
];

// By month (seasonal)
const seasonalData = [
  { month: 'Jan', count: 14 }, { month: 'Feb', count: 12 }, { month: 'Mar', count: 13 },
  { month: 'Apr', count: 11 }, { month: 'May', count: 10 }, { month: 'Jun', count: 16 },
  { month: 'Jul', count: 19 }, { month: 'Aug', count: 18 }, { month: 'Sep', count: 14 },
  { month: 'Oct', count: 11 }, { month: 'Nov', count: 10 }, { month: 'Dec', count: 12 },
];

// Type distribution
const typeData = [
  { name: 'Near Miss', value: 68, color: '#eab308' },
  { name: 'Minor Injury', value: 32, color: '#f97316' },
  { name: 'Major Injury', value: 14, color: '#ef4444' },
  { name: 'Property Damage', value: 18, color: '#3b82f6' },
  { name: 'Environmental', value: 8, color: '#22c55e' },
  { name: 'Unsafe Condition', value: 25, color: '#a855f7' },
  { name: 'Fatality', value: 3, color: '#dc2626' },
];

// Root causes
const rootCauses = [
  { cause: 'Gas Accumulation / Toxic Release', count: 28, pct: 16.7 },
  { cause: 'Procedure / SOP Violation', count: 24, pct: 14.3 },
  { cause: 'Equipment / Mechanical Failure', count: 22, pct: 13.1 },
  { cause: 'Fall from Height', count: 18, pct: 10.7 },
  { cause: 'Electrical Fault / Arc Flash', count: 16, pct: 9.5 },
  { cause: 'Thermal / Burn Exposure', count: 14, pct: 8.3 },
  { cause: 'PPE Non-Compliance', count: 12, pct: 7.1 },
  { cause: 'Confined Space Hazard', count: 10, pct: 6.0 },
  { cause: 'Struck By / Moving Object', count: 9, pct: 5.4 },
  { cause: 'Housekeeping / Slip-Trip-Fall', count: 8, pct: 4.8 },
];

const shiftProfiles = [
  { shift: 'Morning', time: '06:00–14:00', incidents: 58, risk: 72, color: 'text-risk-medium' },
  { shift: 'Evening', time: '14:00–22:00', incidents: 52, risk: 68, color: 'text-risk-high' },
  { shift: 'Night', time: '22:00–06:00', incidents: 38, risk: 55, color: 'text-risk-info' },
];

const preventionPriorities = [
  { action: 'Install continuous gas monitoring with auto-shutdown interlocks', impact: 'High', lives: 12, investment: '₹2.5Cr' },
  { action: 'Implement AI-powered permit conflict detection', impact: 'High', lives: 8, investment: '₹80L' },
  { action: 'Deploy wearable gas detectors for all confined space workers', impact: 'High', lives: 6, investment: '₹1.2Cr' },
  { action: 'Automated shift changeover checklists with digital sign-off', impact: 'Medium', lives: 5, investment: '₹30L' },
  { action: 'Predictive maintenance ML model for critical rotating equipment', impact: 'High', lives: 4, investment: '₹1.5Cr' },
  { action: 'Anti-fall protection upgrade for all elevated work platforms', impact: 'Medium', lives: 4, investment: '₹90L' },
  { action: 'Real-time PPE compliance monitoring via CCTV analytics', impact: 'Medium', lives: 3, investment: '₹60L' },
  { action: 'Electrical arc flash hazard assessment and boundary marking', impact: 'Medium', lives: 3, investment: '₹45L' },
];

const totalIncidents = typeData.reduce((s, t) => s + t.value, 0);
const totalFatalities = 3;
const totalNearMiss = 68;

export default function IncidentsPage() {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold tracking-tight">
          <TrendingUp className="mr-2 inline h-5 w-5 text-accent" />
          Incident Pattern Intelligence
        </h1>
        <p className="mt-1 text-sm text-text-secondary">AI-powered analysis of 3 years of historical incident data to predict and prevent future events</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Total Incidents (3yr)</p>
          <p className="stat-value mt-1 text-3xl font-bold">{totalIncidents}</p>
        </div>
        <div className="glass-card p-4 text-center risk-glow-critical">
          <p className="text-xs uppercase tracking-wider text-text-muted">Fatalities</p>
          <p className="stat-value mt-1 text-3xl font-bold text-risk-critical">{totalFatalities}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Near-Misses</p>
          <p className="stat-value mt-1 text-3xl font-bold text-risk-medium">{totalNearMiss}</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-text-muted">Avg Severity</p>
          <p className="stat-value mt-1 text-3xl font-bold text-accent">2.3<span className="text-lg text-text-muted">/5</span></p>
        </div>
      </motion.div>

      {/* Featured Incident */}
      <motion.div variants={fadeUp} className="glass-card border border-risk-critical/20 p-5 risk-glow-critical">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-risk-critical/10">
            <Star className="h-6 w-6 text-risk-critical" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-risk-critical mb-1">CASE STUDY — REFERENCE INCIDENT</p>
            <h3 className="text-sm font-bold">Visakhapatnam Steel Plant — Coke Oven Battery Explosion (January 2025)</h3>
            <p className="mt-2 text-xs text-text-secondary leading-relaxed">
              Eight workers died when entrapped gases triggered a sudden explosion in the coke oven battery.
              Investigation revealed that gas pressure sensor warning signals existed but no intelligence layer
              connected those readings to operational decisions in time. <span className="text-accent font-medium">SafetyOS would have detected
              the compound risk (elevated CH₄ + active maintenance permit + shift changeover) ~23 minutes before
              the explosion threshold was reached.</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">Root Cause: Gas Accumulation</span>
              <span className="rounded bg-bg-elevated px-2 py-0.5 text-[10px] text-text-muted">Zone: Coke Oven Battery</span>
              <span className="rounded bg-risk-critical/10 px-2 py-0.5 text-[10px] text-risk-critical">8 Fatalities</span>
              <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] text-accent">Preventable with SafetyOS</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Trend Chart */}
      <motion.div variants={fadeUp} className="glass-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Incident Trend (Quarterly, 3 Years)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="month" tick={{ fill: '#666677', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#666677', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="total" stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.15} strokeWidth={2} name="Total" />
              <Area type="monotone" dataKey="severe" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={1.5} name="Severe" />
              <Area type="monotone" dataKey="nearMiss" stroke="#eab308" fill="#eab308" fillOpacity={0.08} strokeWidth={1.5} name="Near-Miss" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Temporal Patterns + Type Distribution */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Hourly */}
        <motion.div variants={fadeUp} className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            <Clock className="mr-1 inline h-3.5 w-3.5" /> By Hour (Shift Change Peaks)
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" tick={{ fill: '#666677', fontSize: 9 }} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {hourlyData.map((d, i) => (
                    <Cell key={i} fill={d.count >= 7 ? '#ef4444' : d.count >= 4 ? '#f97316' : '#22c55e'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-text-muted text-center">⚠️ Peak at 06:00 & 14:00 — shift changeover windows</p>
        </motion.div>

        {/* By Day */}
        <motion.div variants={fadeUp} className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">By Weekday</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="day" tick={{ fill: '#666677', fontSize: 10 }} axisLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="count" fill="#3b82f6" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-text-muted text-center">Monday spike — post-weekend restart effects</p>
        </motion.div>

        {/* Type Pie */}
        <motion.div variants={fadeUp} className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Incident Type Distribution</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                  {typeData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {typeData.slice(0, 6).map(t => (
              <div key={t.name} className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                <span className="text-[9px] text-text-muted truncate">{t.name} ({t.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Root Causes + Shift Profile */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Root Cause */}
        <motion.div variants={fadeUp} className="glass-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
            <Target className="mr-1 inline h-3.5 w-3.5" /> Root Cause Analysis (Top 10)
          </h3>
          <div className="space-y-2.5">
            {rootCauses.map((rc, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-4 text-right font-mono text-[10px] text-text-muted">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">{rc.cause}</span>
                    <span className="font-mono text-[10px] text-text-muted">{rc.count} ({rc.pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${(rc.count / rootCauses[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Shift Profile + Prevention */}
        <div className="space-y-4">
          <motion.div variants={fadeUp} className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Shift Risk Profile</h3>
            <div className="grid grid-cols-3 gap-3">
              {shiftProfiles.map(sp => (
                <div key={sp.shift} className="rounded-xl bg-bg-elevated p-3 text-center">
                  <p className={`text-lg font-bold ${sp.color}`}>{sp.risk}</p>
                  <p className="text-xs font-semibold">{sp.shift}</p>
                  <p className="text-[10px] text-text-muted">{sp.time}</p>
                  <p className="text-[10px] text-text-muted mt-1">{sp.incidents} incidents</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              <Shield className="mr-1 inline h-3.5 w-3.5 text-risk-low" /> Top Prevention Priorities
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {preventionPriorities.map((pp, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-bg-elevated/50 p-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary">{pp.action}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-text-muted">
                      <span className="text-risk-low font-medium">~{pp.lives} lives saved</span>
                      <span>·</span>
                      <span>{pp.investment}</span>
                      <span>·</span>
                      <span className={pp.impact === 'High' ? 'text-risk-low' : 'text-risk-medium'}>{pp.impact} impact</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
