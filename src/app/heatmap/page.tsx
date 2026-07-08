'use client';

import { useSafetyStore } from '@/stores/safety-store';
import { motion } from 'framer-motion';
import { Map, Users, AlertTriangle, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';
import { useState, useMemo } from 'react';

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };

const roleColor: Record<string, string> = {
  operator: '#3b82f6', maintenance: '#f97316', 'safety-officer': '#22c55e',
  supervisor: '#a855f7', contractor: '#eab308', 'emergency-response': '#ef4444',
};

function getZoneRiskColor(criticals: number, warnings: number): string {
  if (criticals >= 2) return 'rgba(239, 68, 68, 0.35)';
  if (criticals >= 1) return 'rgba(239, 68, 68, 0.2)';
  if (warnings >= 3) return 'rgba(249, 115, 22, 0.25)';
  if (warnings >= 1) return 'rgba(234, 179, 8, 0.18)';
  return 'rgba(34, 197, 94, 0.12)';
}

function getZoneStroke(criticals: number): string {
  if (criticals >= 2) return '#ef4444';
  if (criticals >= 1) return '#f97316';
  return '#2a2a3d';
}

export default function HeatmapPage() {
  const zones = useSafetyStore(s => s.zones);
  const sensorReadings = useSafetyStore(s => s.sensorReadings);
  const workers = useSafetyStore(s => s.workers);
  const permits = useSafetyStore(s => s.permits);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const zoneData = useMemo(() => {
    return zones.map(zone => {
      const sensors = Object.values(sensorReadings).filter(r => r.zoneId === zone.id);
      const criticals = sensors.filter(r => r.status === 'critical').length;
      const warnings = sensors.filter(r => r.status === 'warning').length;
      const zoneWorkers = workers.filter(w => w.currentZone === zone.id && w.status === 'active');
      const zonePermits = permits.filter(p => p.zoneId === zone.id && p.status === 'active');
      return { ...zone, sensors, criticals, warnings, workers: zoneWorkers, permits: zonePermits };
    });
  }, [zones, sensorReadings, workers, permits]);

  const selected = zoneData.find(z => z.id === selectedZone);
  const totalWorkers = workers.filter(w => w.status === 'active').length;
  const totalCritical = Object.values(sensorReadings).filter(r => r.status === 'critical').length;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-4">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            <Map className="mr-2 inline h-5 w-5 text-accent" />
            Geospatial Safety Heatmap
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Real-time risk visualization across plant facility</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {totalWorkers} active</span>
          <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-risk-critical" /> {totalCritical} critical</span>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-4">
        {/* Map Area */}
        <div className="flex-1 glass-card overflow-hidden p-1 relative">
          {/* Scan line effect */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-[0.03]">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-accent to-transparent animate-scan-line" />
          </div>

          <svg viewBox="0 0 100 90" className="h-full w-full" style={{ minHeight: 480 }}>
            {/* Grid lines */}
            {Array.from({ length: 10 }, (_, i) => (
              <g key={i}>
                <line x1={i * 10} y1={0} x2={i * 10} y2={90} stroke="#1e1e2e" strokeWidth={0.15} />
                <line x1={0} y1={i * 9} x2={100} y2={i * 9} stroke="#1e1e2e" strokeWidth={0.15} />
              </g>
            ))}

            {/* Zones */}
            {zoneData.map(zone => {
              const isSelected = selectedZone === zone.id;
              const hasCritical = zone.criticals > 0;
              return (
                <g key={zone.id} onClick={() => setSelectedZone(isSelected ? null : zone.id)} className="cursor-pointer">
                  <rect
                    x={zone.position.x} y={zone.position.y}
                    width={zone.size.width} height={zone.size.height}
                    rx={0.8}
                    fill={getZoneRiskColor(zone.criticals, zone.warnings)}
                    stroke={isSelected ? '#ff6b35' : getZoneStroke(zone.criticals)}
                    strokeWidth={isSelected ? 0.5 : 0.25}
                    className={hasCritical ? 'animate-risk-pulse' : ''}
                  />
                  {/* Zone label */}
                  <text
                    x={zone.position.x + zone.size.width / 2}
                    y={zone.position.y + zone.size.height / 2 - 1}
                    textAnchor="middle" dominantBaseline="middle"
                    fill="#9999aa" fontSize={1.8} fontWeight={600}
                  >
                    {zone.name.length > 18 ? zone.name.slice(0, 16) + '…' : zone.name}
                  </text>
                  {/* Hazard level */}
                  <text
                    x={zone.position.x + 1} y={zone.position.y + 2.2}
                    fill="#666677" fontSize={1.3}
                  >
                    H{zone.hazardLevel}
                  </text>
                  {/* Worker count badge */}
                  {zone.workers.length > 0 && (
                    <g>
                      <rect
                        x={zone.position.x + zone.size.width - 4.5} y={zone.position.y + 0.5}
                        width={4} height={2.5} rx={0.5}
                        fill="#3b82f6" fillOpacity={0.9}
                      />
                      <text
                        x={zone.position.x + zone.size.width - 2.5} y={zone.position.y + 2.2}
                        textAnchor="middle" fill="white" fontSize={1.3} fontWeight={700}
                      >
                        {zone.workers.length}
                      </text>
                    </g>
                  )}
                  {/* Worker dots */}
                  {zone.workers.slice(0, 8).map((w, wi) => {
                    const col = Math.floor(wi % 4);
                    const row = Math.floor(wi / 4);
                    const wx = zone.position.x + zone.size.width * 0.2 + col * (zone.size.width * 0.18);
                    const wy = zone.position.y + zone.size.height * 0.65 + row * 2.5;
                    return (
                      <circle
                        key={w.id} cx={wx} cy={wy} r={0.6}
                        fill={roleColor[w.role] || '#666'}
                        opacity={0.85}
                      >
                        <title>{w.name} ({w.role})</title>
                      </circle>
                    );
                  })}
                  {/* Active permit overlay */}
                  {zone.permits.length > 0 && (
                    <rect
                      x={zone.position.x + 0.5} y={zone.position.y + 0.5}
                      width={zone.size.width - 1} height={zone.size.height - 1}
                      rx={0.5} fill="none"
                      stroke="#ff6b35" strokeWidth={0.2} strokeDasharray="1.5 0.8"
                      opacity={0.6}
                    />
                  )}
                </g>
              );
            })}

            {/* Title */}
            <text x={50} y={88} textAnchor="middle" fill="#666677" fontSize={1.6} fontWeight={500}>
              Visakhapatnam Integrated Steel Plant — Live Facility Layout
            </text>
          </svg>
        </div>

        {/* Detail Panel */}
        <div className="w-80 shrink-0 space-y-4">
          {selected ? (
            <>
              {/* Zone Info */}
              <div className={`glass-card p-4 ${selected.criticals > 0 ? 'risk-glow-critical' : selected.warnings > 0 ? 'risk-glow-high' : 'risk-glow-low'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">{selected.name}</h3>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    selected.hazardLevel >= 4 ? 'bg-risk-critical/20 text-risk-critical' :
                    selected.hazardLevel >= 3 ? 'bg-risk-high/20 text-risk-high' :
                    'bg-risk-low/20 text-risk-low'
                  }`}>
                    HAZARD {selected.hazardLevel}
                  </span>
                </div>
                <p className="text-xs text-text-muted mb-3">{selected.description}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-bg-elevated p-2 text-center">
                    <p className="font-mono text-lg font-bold">{selected.workers.length}</p>
                    <p className="text-[10px] text-text-muted">Workers</p>
                  </div>
                  <div className="rounded-lg bg-bg-elevated p-2 text-center">
                    <p className="font-mono text-lg font-bold text-risk-critical">{selected.criticals}</p>
                    <p className="text-[10px] text-text-muted">Critical</p>
                  </div>
                  <div className="rounded-lg bg-bg-elevated p-2 text-center">
                    <p className="font-mono text-lg font-bold">{selected.permits.length}</p>
                    <p className="text-[10px] text-text-muted">Permits</p>
                  </div>
                </div>
              </div>

              {/* Sensors */}
              <div className="glass-card p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Sensor Readings</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selected.sensors.map(s => (
                    <div key={s.sensorId} className="flex items-center justify-between rounded-lg bg-bg-elevated/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${s.status === 'critical' ? 'bg-risk-critical animate-risk-pulse' : s.status === 'warning' ? 'bg-risk-high' : 'bg-risk-low'}`} />
                        <span className="text-xs text-text-secondary">{s.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium">{s.value} {s.unit}</span>
                        {s.trend === 'rising' ? <TrendingUp className="h-3 w-3 text-risk-critical" /> :
                         s.trend === 'falling' ? <TrendingDown className="h-3 w-3 text-risk-low" /> :
                         <Minus className="h-3 w-3 text-text-muted" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workers */}
              <div className="glass-card p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Workers ({selected.workers.length})</h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selected.workers.slice(0, 15).map(w => (
                    <div key={w.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: roleColor[w.role] || '#666' }} />
                        <span className="text-text-secondary">{w.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted capitalize">{w.role.replace('-', ' ')}</span>
                        {!w.ppeCompliance && <span className="text-[9px] font-bold text-risk-critical">NO PPE</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Permits */}
              {selected.permits.length > 0 && (
                <div className="glass-card p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Active Permits</h4>
                  <div className="space-y-2">
                    {selected.permits.map(p => (
                      <div key={p.id} className="rounded-lg bg-bg-elevated/50 px-3 py-2">
                        <p className="text-xs font-medium text-text-primary truncate">{p.title}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{p.workers.length} workers · {p.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center py-16 px-6 text-center">
              <Eye className="h-10 w-10 text-text-muted mb-3" />
              <h3 className="text-sm font-semibold text-text-secondary">Select a Zone</h3>
              <p className="text-xs text-text-muted mt-1">Click on any zone in the plant layout to view detailed sensor readings, worker positions, and active permits</p>
            </div>
          )}

          {/* Legend */}
          <div className="glass-card p-3">
            <h4 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">Legend</h4>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { color: 'rgba(239,68,68,0.35)', label: 'Critical (2+)' },
                { color: 'rgba(249,115,22,0.25)', label: 'Warning' },
                { color: 'rgba(234,179,8,0.18)', label: 'Elevated' },
                { color: 'rgba(34,197,94,0.12)', label: 'Normal' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
                  <span className="text-[10px] text-text-muted">{l.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border-subtle">
              <p className="text-[10px] text-text-muted mb-1">Worker Roles</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(roleColor).map(([role, color]) => (
                  <div key={role} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="text-[10px] text-text-muted capitalize">{role.replace('-', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
