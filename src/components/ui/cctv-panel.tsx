'use client';

import { motion } from 'framer-motion';
import { Eye, ShieldCheck, ShieldX, Camera, User } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Detection {
  workerId: string;
  workerName: string;
  camera: string;
  zone: string;
  helmet: boolean;
  vest: boolean;
  gloves: boolean;
  faceShield: boolean;
  safetyBoots: boolean;
  confidence: number;
  timestamp: Date;
}

const MOCK_WORKERS = [
  'Rajesh Kumar', 'Amit Singh', 'Suresh Sharma', 'Vikram Patel',
  'Manoj Reddy', 'Yogesh Thakur', 'Deepak Mishra', 'Arun Rao',
];
const ZONES = ['Coke Oven Battery', 'Blast Furnace #1', 'SMS Bay', 'Rolling Mill', 'Gas Recovery'];
const CAMERAS = ['CCTV-01', 'CCTV-02', 'CCTV-03', 'CCTV-04', 'CCTV-05', 'CCTV-06'];

function generateDetection(): Detection {
  const compliant = Math.random() > 0.25;
  return {
    workerId: `WKR-${String(Math.floor(Math.random() * 150) + 1).padStart(3, '0')}`,
    workerName: MOCK_WORKERS[Math.floor(Math.random() * MOCK_WORKERS.length)],
    camera: CAMERAS[Math.floor(Math.random() * CAMERAS.length)],
    zone: ZONES[Math.floor(Math.random() * ZONES.length)],
    helmet: compliant || Math.random() > 0.15,
    vest: compliant || Math.random() > 0.2,
    gloves: compliant || Math.random() > 0.25,
    faceShield: compliant || Math.random() > 0.35,
    safetyBoots: compliant || Math.random() > 0.1,
    confidence: 92 + Math.floor(Math.random() * 8),
    timestamp: new Date(),
  };
}

function PPEItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium ${
      ok ? 'bg-risk-low/10 text-risk-low' : 'bg-risk-critical/10 text-risk-critical'
    }`}>
      {ok ? '✓' : '✗'} {label}
    </div>
  );
}

export function CCTVPanel() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [totalScanned, setTotalScanned] = useState(847);
  const [violations, setViolations] = useState(12);

  useEffect(() => {
    // Initial detections
    setDetections(Array.from({ length: 4 }, generateDetection));

    const interval = setInterval(() => {
      setDetections(prev => {
        const newDet = generateDetection();
        const isViolation = !newDet.helmet || !newDet.vest || !newDet.gloves || !newDet.faceShield || !newDet.safetyBoots;
        if (isViolation) setViolations(v => v + 1);
        setTotalScanned(t => t + 1);
        return [newDet, ...prev.slice(0, 3)];
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const complianceRate = detections.length > 0
    ? Math.round((detections.filter(d => d.helmet && d.vest && d.gloves && d.faceShield && d.safetyBoots).length / detections.length) * 100)
    : 100;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Vision Analytics Agent — PPE Detection</h3>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-text-muted"><span className="font-mono text-text-secondary">{totalScanned}</span> scanned</span>
          <span className="text-risk-critical"><span className="font-mono font-bold">{violations}</span> violations</span>
          <span className="flex items-center gap-1 text-risk-low">
            <div className="h-1.5 w-1.5 rounded-full bg-risk-low animate-pulse" /> LIVE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {detections.map((det, i) => {
          const allOk = det.helmet && det.vest && det.gloves && det.faceShield && det.safetyBoots;
          return (
            <motion.div
              key={`${det.workerId}-${i}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-3 ${
                allOk ? 'bg-risk-low/5 border-risk-low/15' : 'bg-risk-critical/5 border-risk-critical/15'
              }`}
            >
              {/* Camera Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Camera className="h-3 w-3 text-text-muted" />
                  <span className="font-mono text-[10px] text-text-muted">{det.camera}</span>
                </div>
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                  allOk ? 'bg-risk-low/20 text-risk-low' : 'bg-risk-critical/20 text-risk-critical animate-pulse'
                }`}>
                  {allOk ? 'COMPLIANT' : 'VIOLATION'}
                </span>
              </div>

              {/* Worker */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-bg-elevated">
                  <User className="h-3.5 w-3.5 text-text-muted" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-text-primary">{det.workerName}</p>
                  <p className="text-[9px] text-text-muted">{det.zone}</p>
                </div>
              </div>

              {/* PPE Items */}
              <div className="flex flex-wrap gap-1 mb-2">
                <PPEItem label="Helmet" ok={det.helmet} />
                <PPEItem label="Vest" ok={det.vest} />
                <PPEItem label="Gloves" ok={det.gloves} />
                <PPEItem label="Face Shield" ok={det.faceShield} />
                <PPEItem label="Boots" ok={det.safetyBoots} />
              </div>

              {/* Confidence */}
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-text-muted">Detection Confidence</span>
                <span className="font-mono font-bold text-risk-low">{det.confidence}%</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
