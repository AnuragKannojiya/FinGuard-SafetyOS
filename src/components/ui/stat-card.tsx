'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  trendLabel?: string;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
}

const variantStyles = {
  default: {
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    glow: '',
  },
  critical: {
    iconBg: 'bg-risk-critical/10',
    iconColor: 'text-risk-critical',
    glow: 'risk-glow-critical',
  },
  warning: {
    iconBg: 'bg-risk-high/10',
    iconColor: 'text-risk-high',
    glow: 'risk-glow-high',
  },
  success: {
    iconBg: 'bg-risk-low/10',
    iconColor: 'text-risk-low',
    glow: 'risk-glow-low',
  },
  info: {
    iconBg: 'bg-risk-info/10',
    iconColor: 'text-risk-info',
    glow: '',
  },
};

export function StatCard({ title, value, subtitle, icon, trend, trendValue, trendLabel, variant = 'default' }: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 ${styles.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{title}</p>
          <p className="stat-value mt-2 text-3xl font-bold text-text-primary">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className="mt-2 flex items-center gap-1.5">
              {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-risk-critical" />}
              {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-risk-low" />}
              {trend === 'stable' && <Minus className="h-3.5 w-3.5 text-text-muted" />}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-risk-critical' : trend === 'down' ? 'text-risk-low' : 'text-text-muted'}`}>
                {trendValue}
              </span>
              {trendLabel && <span className="text-xs text-text-muted">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles.iconBg}`}>
          <div className={styles.iconColor}>{icon}</div>
        </div>
      </div>
    </motion.div>
  );
}
