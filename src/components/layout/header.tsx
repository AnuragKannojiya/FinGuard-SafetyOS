'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Sun,
  Moon,
  Clock,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSafetyStore } from '@/stores/safety-store';

function getCurrentShift(hour: number): string {
  if (hour >= 6 && hour < 14) return 'Morning Shift (A)';
  if (hour >= 14 && hour < 22) return 'Evening Shift (B)';
  return 'Night Shift (C)';
}

function getShiftColor(hour: number): string {
  if (hour >= 6 && hour < 14) return 'text-risk-medium';
  if (hour >= 14 && hour < 22) return 'text-accent';
  return 'text-risk-info';
}

export function Header() {
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const alerts = useSafetyStore((s) => s.alerts);
  const activeWorkers = useSafetyStore((s) => s.workers.filter(w => w.status === 'active').length);
  const isSimulating = useSafetyStore((s) => s.isSimulating);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = time.getHours();
  const unreadAlerts = alerts.filter(a => !a.acknowledged).length;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-default bg-bg-secondary/80 px-6 backdrop-blur-md">
      {/* Left: Page Context */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative">
          <AnimatePresence>
            {searchOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center overflow-hidden"
              >
                <Search className="absolute left-3 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search zones, sensors, permits..."
                  className="h-8 w-full rounded-lg border border-border-default bg-bg-primary pl-9 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setSearchOpen(false)}
                  className="absolute right-2"
                >
                  <X className="h-3.5 w-3.5 text-text-muted hover:text-text-primary" />
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border-default bg-bg-primary px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-border-focus hover:text-text-secondary"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline">
                  ⌘K
                </kbd>
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Status & Actions */}
      <div className="flex items-center gap-4">
        {/* Simulation Status */}
        <div className="flex items-center gap-2 rounded-full border border-border-default bg-bg-primary px-3 py-1">
          {isSimulating ? (
            <Wifi className="h-3 w-3 text-risk-low animate-pulse-glow" />
          ) : (
            <WifiOff className="h-3 w-3 text-text-muted" />
          )}
          <span className="text-[11px] font-medium text-text-secondary">
            {isSimulating ? 'LIVE' : 'PAUSED'}
          </span>
        </div>

        {/* Active Workers */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Users className="h-3.5 w-3.5" />
          <span className="font-mono text-xs">{activeWorkers}</span>
        </div>

        {/* Shift Indicator */}
        <div className="hidden items-center gap-1.5 md:flex">
          <Clock className={`h-3.5 w-3.5 ${getShiftColor(hour)}`} />
          <span className="text-xs font-medium text-text-secondary">
            {getCurrentShift(hour)}
          </span>
        </div>

        {/* Clock */}
        <div className="font-mono text-xs tabular-nums text-text-secondary">
          {time.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' })}
          <span className="ml-1 text-text-muted">IST</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          >
            <Bell className="h-4 w-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-risk-critical px-1 text-[9px] font-bold text-white animate-risk-pulse">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 z-50 w-80 glass-card overflow-hidden shadow-2xl"
              >
                <div className="border-b border-border-default p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Alerts</h3>
                    <span className="rounded-full bg-risk-critical/20 px-2 py-0.5 text-[10px] font-bold text-risk-critical">
                      {unreadAlerts} unread
                    </span>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-text-muted">
                      No active alerts
                    </div>
                  ) : (
                    alerts.slice(0, 5).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex gap-3 border-b border-border-subtle p-3 transition-colors hover:bg-bg-hover"
                      >
                        <div
                          className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                            alert.severity === 'critical' || alert.severity === 'emergency'
                              ? 'bg-risk-critical animate-risk-pulse'
                              : alert.severity === 'warning'
                              ? 'bg-risk-high'
                              : 'bg-risk-medium'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-text-primary truncate">
                            {alert.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-muted truncate">
                            {alert.zone} · {alert.source}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] text-text-muted">
                          {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
