'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Area, AreaChart } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Brain } from 'lucide-react';
import { useMemo } from 'react';

interface PredictionPoint { time: string; actual?: number; predicted?: number; }

export function RiskPredictionGraph() {
  const data = useMemo(() => {
    const now = new Date();
    const points: PredictionPoint[] = [];

    // Past 60 min — actual readings
    for (let i = -60; i <= 0; i += 5) {
      const t = new Date(now.getTime() + i * 60000);
      const label = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      const base = 20 + Math.sin(i / 15) * 8 + (i + 60) * 0.4;
      points.push({ time: label, actual: Math.round(Math.max(5, Math.min(95, base + Math.random() * 8))) });
    }

    // Future 60 min — prediction
    const lastActual = points[points.length - 1].actual || 40;
    for (let i = 5; i <= 60; i += 5) {
      const t = new Date(now.getTime() + i * 60000);
      const label = t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
      const drift = lastActual + i * 0.7 + Math.sin(i / 10) * 5;
      points.push({ time: label, predicted: Math.round(Math.max(10, Math.min(98, drift))) });
    }

    // Overlap point
    const lastIdx = points.findIndex(p => p.predicted !== undefined) - 1;
    if (lastIdx >= 0) {
      points[lastIdx + 1] = { ...points[lastIdx + 1], actual: points[lastIdx].actual };
    }

    return points;
  }, []);

  const maxPredicted = Math.max(...data.filter(d => d.predicted).map(d => d.predicted || 0));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">AI Risk Prediction — Next 60 Minutes</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-accent inline-block" /> Actual</span>
          <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-risk-critical inline-block opacity-50" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, #ef4444 2px, #ef4444 4px)' }} /> Predicted</span>
          <span className="flex items-center gap-1 text-text-muted">
            <Brain className="h-3 w-3" /> Conf: 88%
          </span>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
            <XAxis dataKey="time" tick={{ fill: '#666677', fontSize: 9 }} axisLine={false} interval={2} />
            <YAxis domain={[0, 100]} tick={{ fill: '#666677', fontSize: 9 }} axisLine={false} />
            <Tooltip contentStyle={{ background: '#151520', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 11 }} />
            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'CRITICAL', fill: '#ef4444', fontSize: 9 }} />
            <ReferenceLine y={40} stroke="#f97316" strokeDasharray="5 5" label={{ value: 'WARNING', fill: '#f97316', fontSize: 9 }} />
            <Area type="monotone" dataKey="actual" stroke="#ff6b35" fill="#ff6b35" fillOpacity={0.1} strokeWidth={2} dot={false} name="Actual Risk" />
            <Area type="monotone" dataKey="predicted" stroke="#ef4444" fill="#ef4444" fillOpacity={0.06} strokeWidth={2} strokeDasharray="6 3" dot={false} name="Predicted Risk" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {maxPredicted > 70 && (
        <div className="mt-2 rounded-lg bg-risk-critical/10 border border-risk-critical/20 px-3 py-2 flex items-center gap-2">
          <span className="text-[10px] text-risk-critical font-bold">⚠ AI PREDICTION:</span>
          <span className="text-[10px] text-text-secondary">Risk projected to reach {maxPredicted}% within 60 min. Recommend preemptive action.</span>
        </div>
      )}
    </motion.div>
  );
}
