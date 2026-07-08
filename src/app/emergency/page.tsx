'use client';

import { useSafetyStore, type EmergencyEvent } from '@/stores/safety-store';
import { motion } from 'framer-motion';
import {
  Siren, Flame, Wind, Bomb, Building, Beaker, HeartPulse,
  CheckCircle, Clock, Users, Shield, Phone, Radio, FileText,
  Play,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

const emergencyTypes = [
  { type: 'fire' as const, label: 'Fire', icon: Flame, color: 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25' },
  { type: 'gas-leak' as const, label: 'Gas Leak', icon: Wind, color: 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25' },
  { type: 'explosion' as const, label: 'Explosion', icon: Bomb, color: 'bg-red-600/15 text-red-300 border-red-600/30 hover:bg-red-600/25' },
  { type: 'structural' as const, label: 'Structural', icon: Building, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25' },
  { type: 'chemical-spill' as const, label: 'Chemical Spill', icon: Beaker, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25' },
  { type: 'medical' as const, label: 'Medical', icon: HeartPulse, color: 'bg-pink-500/15 text-pink-400 border-pink-500/30 hover:bg-pink-500/25' },
];

const processZones = ['coke-oven', 'blast-furnace', 'sms', 'rolling-mill', 'gas-recovery'];
const adjacency: Record<string, string[]> = {
  'coke-oven': ['gas-recovery', 'blast-furnace'],
  'blast-furnace': ['coke-oven', 'sms'],
  'sms': ['blast-furnace', 'rolling-mill'],
  'rolling-mill': ['sms'],
  'gas-recovery': ['coke-oven', 'hazwaste'],
};

const responseSteps = [
  { action: 'Emergency detected by SafetyOS AI', delay: 0 },
  { action: 'Alarm sirens activated across affected zones', delay: 3000 },
  { action: 'Emergency response teams alerted via PA + SMS', delay: 5000 },
  { action: 'Evacuation protocol initiated for affected zones', delay: 8000 },
  { action: 'SCADA auto-shutdown of nearby process units', delay: 11000 },
  { action: 'Fire brigade and medical team dispatched', delay: 14000 },
  { action: 'Sensor evidence snapshot preserved for investigation', delay: 17000 },
  { action: 'Regulatory notification drafted (DGFASLI/Factory Inspector)', delay: 20000 },
  { action: 'Preliminary incident report auto-generated', delay: 24000 },
];

const teams = [
  { name: 'Fire Brigade', strength: 12, status: 'Ready', lastDrill: '2026-06-28' },
  { name: 'Medical Response', strength: 8, status: 'Ready', lastDrill: '2026-06-25' },
  { name: 'Hazmat Unit', strength: 6, status: 'Ready', lastDrill: '2026-07-01' },
  { name: 'Evacuation Marshals', strength: 15, status: 'Ready', lastDrill: '2026-06-30' },
  { name: 'Security Response', strength: 10, status: 'Ready', lastDrill: '2026-07-03' },
];

export default function EmergencyPage() {
  const activeEmergency = useSafetyStore(s => s.activeEmergency);
  const triggerEmergency = useSafetyStore(s => s.triggerEmergency);
  const resolveEmergency = useSafetyStore(s => s.resolveEmergency);
  const zones = useSafetyStore(s => s.zones);
  const [actions, setActions] = useState<{ time: Date; action: string; status: 'completed' | 'in-progress' | 'pending' }[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const handleTrigger = useCallback((type: EmergencyEvent['type']) => {
    const zone = processZones[Math.floor(Math.random() * processZones.length)];
    const evacZones = [zone, ...(adjacency[zone] || [])];
    
    const event: EmergencyEvent = {
      id: `EMR-${Date.now()}`,
      type,
      severity: 'emergency',
      status: 'detected',
      zone,
      triggeredAt: new Date(),
      evacuationZones: evacZones,
      responseTeams: ['Fire Brigade', 'Medical Response', 'Hazmat Unit'],
      casualties: { injuries: 0, fatalities: 0 },
      actions: [{ time: new Date(), action: responseSteps[0].action, status: 'completed' }],
    };
    
    triggerEmergency(event);
    setActions([{ time: new Date(), action: responseSteps[0].action, status: 'completed' }]);
    
    // Progressive response simulation
    responseSteps.slice(1).forEach((step, i) => {
      setTimeout(() => {
        setActions(prev => [...prev, { time: new Date(), action: step.action, status: 'completed' }]);
      }, step.delay);
    });
  }, [triggerEmergency]);

  // Elapsed timer
  useEffect(() => {
    if (!activeEmergency) { setElapsed(0); setActions([]); return; }
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeEmergency.triggeredAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEmergency]);

  const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold tracking-tight">
          <Siren className="mr-2 inline h-5 w-5 text-accent" />
          Emergency Response Orchestrator
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Autonomous emergency detection, response coordination, and evidence preservation</p>
      </motion.div>

      {activeEmergency ? (
        /* ── ACTIVE EMERGENCY STATE ── */
        <>
          {/* Alert Banner */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="glass-card border-2 border-risk-critical risk-glow-critical overflow-hidden"
          >
            <div className="bg-risk-critical/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-risk-critical/20 animate-alert-flash">
                    <Siren className="h-8 w-8 text-risk-critical" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-risk-critical uppercase animate-alert-flash">
                      🚨 {activeEmergency.type.replace('-', ' ')} Emergency
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                      Zone: <span className="font-semibold text-text-primary">{zones.find(z => z.id === activeEmergency.zone)?.name || activeEmergency.zone}</span>
                      <span className="mx-2">·</span>
                      Triggered: {new Date(activeEmergency.triggeredAt).toLocaleTimeString('en-IN', { hour12: false })} IST
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-4xl font-bold text-risk-critical">{fmtTime(elapsed)}</div>
                  <div className="text-xs text-text-muted uppercase">Elapsed</div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Response Timeline */}
            <div className="xl:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                <Clock className="mr-2 inline h-4 w-4" /> Automated Response Timeline
              </h3>
              <div className="glass-card p-6">
                <div className="space-y-4">
                  {responseSteps.map((step, i) => {
                    const completed = actions.length > i;
                    const current = actions.length === i;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: completed || current ? 1 : 0.3, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-4"
                      >
                        <div className="mt-0.5 flex flex-col items-center">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            completed ? 'bg-risk-low/20' : current ? 'bg-accent/20 animate-risk-pulse' : 'bg-bg-elevated'
                          }`}>
                            {completed ? (
                              <CheckCircle className="h-4 w-4 text-risk-low" />
                            ) : current ? (
                              <Play className="h-3 w-3 text-accent" />
                            ) : (
                              <div className="h-2 w-2 rounded-full bg-text-muted" />
                            )}
                          </div>
                          {i < responseSteps.length - 1 && (
                            <div className={`h-6 w-px ${completed ? 'bg-risk-low/30' : 'bg-border-subtle'}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className={`text-sm ${completed ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                            {step.action}
                          </p>
                          {completed && actions[i] && (
                            <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                              {new Date(actions[i].time).toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Incident Report Preview */}
              {actions.length >= responseSteps.length && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 border border-accent/20">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-accent mb-4">
                    <FileText className="h-4 w-4" /> Auto-Generated Incident Report
                  </h3>
                  <div className="space-y-3 text-xs text-text-secondary font-mono">
                    <p><span className="text-text-muted">REPORT ID:</span> {activeEmergency.id}</p>
                    <p><span className="text-text-muted">TYPE:</span> {activeEmergency.type.toUpperCase().replace('-', ' ')}</p>
                    <p><span className="text-text-muted">LOCATION:</span> {zones.find(z => z.id === activeEmergency.zone)?.name}</p>
                    <p><span className="text-text-muted">TRIGGERED:</span> {new Date(activeEmergency.triggeredAt).toISOString()}</p>
                    <p><span className="text-text-muted">RESPONSE TIME:</span> {fmtTime(elapsed)}</p>
                    <p><span className="text-text-muted">EVACUATION ZONES:</span> {activeEmergency.evacuationZones.map(z => zones.find(zn => zn.id === z)?.name || z).join(', ')}</p>
                    <p><span className="text-text-muted">TEAMS DEPLOYED:</span> {activeEmergency.responseTeams.join(', ')}</p>
                    <p><span className="text-text-muted">STATUS:</span> Response in progress — all automated actions completed</p>
                    <p className="text-text-muted italic mt-2">Report generated per DGFASLI Section 88-A notification requirements and Factory Act 1948 Schedule XXI format.</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right Panel */}
            <div className="space-y-4">
              {/* Evacuation */}
              <div className="glass-card p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Evacuation Zones</h4>
                <div className="space-y-2">
                  {activeEmergency.evacuationZones.map((z, i) => (
                    <div key={z} className="flex items-center justify-between rounded-lg bg-risk-critical/5 px-3 py-2 border border-risk-critical/10">
                      <span className="text-xs font-medium">{zones.find(zn => zn.id === z)?.name || z}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        i === 0 ? 'bg-risk-critical/20 text-risk-critical animate-alert-flash' : 'bg-risk-high/20 text-risk-high'
                      }`}>
                        {i === 0 ? 'PRIMARY' : 'ADJACENT'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Teams */}
              <div className="glass-card p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Response Teams</h4>
                <div className="space-y-2">
                  {teams.slice(0, 3).map(t => (
                    <div key={t.name} className="flex items-center justify-between rounded-lg bg-bg-elevated/50 px-3 py-2">
                      <div>
                        <p className="text-xs font-medium">{t.name}</p>
                        <p className="text-[10px] text-text-muted">{t.strength} personnel</p>
                      </div>
                      <span className="rounded bg-risk-low/20 px-1.5 py-0.5 text-[10px] font-bold text-risk-low">DEPLOYED</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolve Button */}
              <button
                onClick={() => { resolveEmergency(); setActions([]); }}
                className="w-full rounded-xl bg-risk-low/15 border border-risk-low/30 py-3 text-sm font-bold text-risk-low transition-all hover:bg-risk-low/25 hover:scale-[1.02] active:scale-[0.98]"
              >
                ✓ RESOLVE EMERGENCY
              </button>
            </div>
          </div>
        </>
      ) : (
        /* ── NO EMERGENCY STATE ── */
        <>
          {/* All Clear */}
          <motion.div variants={fadeUp} className="glass-card border border-risk-low/20 p-8 text-center risk-glow-low">
            <CheckCircle className="mx-auto h-16 w-16 text-risk-low mb-4" />
            <h2 className="text-xl font-bold text-risk-low">No Active Emergency</h2>
            <p className="mt-2 text-sm text-text-muted">All zones operating within normal parameters. Emergency systems on standby.</p>
          </motion.div>

          {/* Trigger Panel */}
          <motion.div variants={fadeUp} className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
              <Siren className="mr-2 inline h-4 w-4" /> Simulate Emergency
            </h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {emergencyTypes.map(et => {
                const Icon = et.icon;
                return (
                  <button
                    key={et.type}
                    onClick={() => handleTrigger(et.type)}
                    className={`glass-card flex items-center gap-3 border p-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${et.color}`}
                  >
                    <Icon className="h-6 w-6 shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{et.label}</p>
                      <p className="text-[10px] opacity-70">Trigger simulation</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Preparedness */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                <Users className="mr-2 inline h-4 w-4" /> Response Team Readiness
              </h3>
              <div className="glass-card p-4 space-y-3">
                {teams.map(t => (
                  <div key={t.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{t.name}</p>
                      <p className="text-[10px] text-text-muted">{t.strength} personnel · Last drill: {t.lastDrill}</p>
                    </div>
                    <span className="rounded bg-risk-low/20 px-1.5 py-0.5 text-[10px] font-bold text-risk-low">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
                <Shield className="mr-2 inline h-4 w-4" /> Emergency Protocols
              </h3>
              <div className="glass-card p-4 space-y-2">
                {[
                  'On-site Emergency Plan (OSEP) — Rev. 12, Jan 2026',
                  'Mutual Aid Agreement with Visakhapatnam Fire Dept',
                  'DGFASLI Emergency Notification SOP',
                  'Toxic Gas Release Contingency Plan',
                  'Mass Casualty Incident Protocol',
                  'Media Communication Protocol',
                  'Environmental Spill Response Plan',
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                    <CheckCircle className="h-3 w-3 text-risk-low shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
