'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Map,
  FileCheck,
  Siren,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafetyStore } from '@/stores/safety-store';
import { AgentStatusPanel } from '@/components/ui/agent-status';

const navigation = [
  {
    name: 'Command Center',
    href: '/',
    icon: LayoutDashboard,
    description: 'Plant overview & live status',
  },
  {
    name: 'Risk Engine',
    href: '/risk-engine',
    icon: AlertTriangle,
    description: 'Compound risk detection',
  },
  {
    name: 'Safety Heatmap',
    href: '/heatmap',
    icon: Map,
    description: 'Geospatial risk visualization',
  },
  {
    name: 'Permit Intel',
    href: '/permits',
    icon: FileCheck,
    description: 'Digital permit intelligence',
  },
  {
    name: 'Emergency',
    href: '/emergency',
    icon: Siren,
    description: 'Response orchestrator',
  },
  {
    name: 'Compliance',
    href: '/compliance',
    icon: ShieldCheck,
    description: 'Regulatory audit agent',
  },
  {
    name: 'Incidents',
    href: '/incidents',
    icon: TrendingUp,
    description: 'Pattern intelligence',
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const plantStatus = useSafetyStore((s) => s.plantStatus);
  const criticalAlerts = useSafetyStore((s) => s.alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency').length);

  const statusColor = plantStatus === 'critical' ? 'bg-risk-critical' :
    plantStatus === 'warning' ? 'bg-risk-high' :
    plantStatus === 'elevated' ? 'bg-risk-medium' : 'bg-risk-low';

  const statusGlow = plantStatus === 'critical' ? 'shadow-[0_0_12px_rgba(239,68,68,0.5)]' :
    plantStatus === 'warning' ? 'shadow-[0_0_12px_rgba(249,115,22,0.4)]' :
    plantStatus === 'elevated' ? 'shadow-[0_0_12px_rgba(234,179,8,0.3)]' : 'shadow-[0_0_12px_rgba(34,197,94,0.3)]';

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative flex h-full flex-col border-r border-border-default bg-bg-secondary"
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border-default px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-orange-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-sm font-bold tracking-tight text-text-primary">
                FinGuard
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-accent">
                SafetyOS
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plant Status */}
      <div className="border-b border-border-default p-4">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 shrink-0 rounded-full ${statusColor} ${statusGlow} animate-pulse-glow`} />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-secondary">Plant Status</span>
                  {criticalAlerts > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-risk-critical px-1.5 text-[10px] font-bold text-white animate-alert-flash">
                      {criticalAlerts}
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold capitalize text-text-primary">{plantStatus}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-accent' : ''}`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI Agents (compact) */}
      {!collapsed && (
        <div className="border-t border-border-default p-3">
          <AgentStatusPanel compact />
        </div>
      )}

      {/* Live Data Indicator */}
      <div className="border-t border-border-default p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 shrink-0 text-risk-low animate-data-flow" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] font-medium text-text-muted"
              >
                7 AI Agents Active
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border-default bg-bg-secondary text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </motion.aside>
  );
}
