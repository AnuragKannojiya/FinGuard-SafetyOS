'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, AlertTriangle, TrendingUp, Clock, Shield, Zap } from 'lucide-react';
import { useState } from 'react';

interface Evidence {
  label: string;
  value: string;
  icon?: string;
  status: 'danger' | 'warning' | 'normal';
}

interface AIReasoningProps {
  title: string;
  riskScore: number;
  confidence: number;
  predictionTime: number;
  evidenceChain: Evidence[];
  recommendations: { action: string; impact: string; priority: number }[];
  historicalSimilarity?: number;
  explanation: string;
  severity: 'advisory' | 'warning' | 'critical' | 'emergency';
  formulaBreakdown?: { factor: string; weight: number; score: number }[];
}

const sevColor: Record<string, string> = { emergency: '#ef4444', critical: '#ef4444', warning: '#f97316', advisory: '#eab308' };
const sevBg: Record<string, string> = {
  emergency: 'bg-risk-critical/10 border-risk-critical/30',
  critical: 'bg-risk-critical/10 border-risk-critical/20',
  warning: 'bg-risk-high/10 border-risk-high/20',
  advisory: 'bg-risk-medium/10 border-risk-medium/20',
};

export function AIReasoningCard({
  title, riskScore, confidence, predictionTime, evidenceChain, recommendations,
  historicalSimilarity, explanation, severity, formulaBreakdown,
}: AIReasoningProps) {
  const [expanded, setExpanded] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden border ${sevBg[severity]} ${severity === 'critical' || severity === 'emergency' ? 'risk-glow-critical' : severity === 'warning' ? 'risk-glow-high' : ''}`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-accent mb-0.5">SafetyOS AI Reasoning</p>
              <h3 className="text-sm font-bold text-text-primary">{title}</h3>
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Risk Score Ring */}
            <div className="text-center">
              <div className="relative h-14 w-14">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#1e1e2e" strokeWidth="3.5" />
                  <circle cx="28" cy="28" r="22" fill="none"
                    stroke={sevColor[severity]} strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${riskScore * 1.382} 138.2`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold" style={{ color: sevColor[severity] }}>
                  {Math.round(riskScore)}%
                </span>
              </div>
              <p className="text-[8px] uppercase text-text-muted mt-0.5">Risk</p>
            </div>
            {/* Confidence */}
            <div className="text-center">
              <div className="relative h-14 w-14">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="22" fill="none" stroke="#1e1e2e" strokeWidth="3.5" />
                  <circle cx="28" cy="28" r="22" fill="none"
                    stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${confidence * 1.382} 138.2`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-risk-low">
                  {confidence}%
                </span>
              </div>
              <p className="text-[8px] uppercase text-text-muted mt-0.5">Confidence</p>
            </div>
            {/* Lead Time */}
            <div className="text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-bg-elevated">
                <div>
                  <p className="font-mono text-lg font-bold text-accent">{predictionTime}</p>
                  <p className="text-[8px] text-text-muted">MIN</p>
                </div>
              </div>
              <p className="text-[8px] uppercase text-text-muted mt-0.5">Lead Time</p>
            </div>
          </div>
        </div>

        {/* Evidence Chain */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {evidenceChain.map((e, i) => (
            <span key={i} className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
              e.status === 'danger' ? 'bg-risk-critical/15 text-risk-critical' :
              e.status === 'warning' ? 'bg-risk-high/15 text-risk-high' :
              'bg-risk-low/15 text-risk-low'
            }`}>
              {e.status === 'danger' ? '✗' : e.status === 'warning' ? '⚠' : '✓'} {e.label}: {e.value}
            </span>
          ))}
          {historicalSimilarity && (
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-medium text-accent">
              <Shield className="h-3 w-3" /> Historical Match: {historicalSimilarity}%
            </span>
          )}
        </div>

        {/* Expand/Collapse */}
        <button onClick={() => setExpanded(!expanded)} className="mt-3 flex items-center gap-1 text-[10px] font-medium text-accent hover:text-accent/80 transition-colors">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? 'Hide Details' : 'Show AI Analysis'}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-subtle p-4 space-y-4">
              {/* Compound Risk Formula */}
              {formulaBreakdown && formulaBreakdown.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-accent" /> Compound Risk Formula
                  </h4>
                  <div className="space-y-2">
                    {formulaBreakdown.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-32 text-[11px] text-text-secondary truncate">{f.factor}</span>
                        <div className="flex-1 h-2 rounded-full bg-bg-elevated overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${f.score}%`,
                              backgroundColor: f.score > 70 ? '#ef4444' : f.score > 40 ? '#f97316' : '#22c55e',
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-text-muted w-8 text-right">{f.score}%</span>
                        <span className="font-mono text-[9px] text-text-muted w-10 text-right">w:{f.weight}%</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-3 pt-2 border-t border-border-subtle">
                      <span className="w-32 text-[11px] font-bold text-text-primary">Compound Score</span>
                      <div className="flex-1" />
                      <span className="font-mono text-sm font-bold" style={{ color: sevColor[severity] }}>= {Math.round(riskScore)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">AI Recommended Actions</h4>
                <div className="space-y-1.5">
                  {recommendations.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-bg-elevated/50 px-3 py-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">
                        {r.priority}
                      </span>
                      <span className="flex-1 text-xs text-text-secondary">{r.action}</span>
                      <span className="shrink-0 rounded bg-risk-low/15 px-2 py-0.5 text-[10px] font-medium text-risk-low">{r.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explain Prediction */}
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-1.5 text-[10px] font-medium text-accent hover:underline"
              >
                <Brain className="h-3 w-3" />
                {showExplanation ? 'Hide Explanation' : 'Explain This Prediction'}
              </button>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg bg-accent/5 border border-accent/15 p-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1.5">SafetyOS AI Explanation</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{explanation}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
