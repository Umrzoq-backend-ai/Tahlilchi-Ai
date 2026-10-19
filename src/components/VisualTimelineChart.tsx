'use client';

import React, { useState } from 'react';
import { Activity, Clock, Users, Flame, Info } from 'lucide-react';
import { AnalysisResponse, TimestampItem } from '@/types';

interface VisualTimelineChartProps {
  result: AnalysisResponse;
  onSeek?: (timeStr: string) => void;
}

export default function VisualTimelineChart({
  result,
  onSeek,
}: VisualTimelineChartProps) {
  const [activePin, setActivePin] = useState<{ time: string; text: string; type: string } | null>(null);

  const timestamps = result.timestamps || [];
  const factChecks = result.fact_check || [];
  const decisions = result.key_decisions || [];

  // Combine key markers
  const markers: Array<{ time: string; text: string; type: 'fact' | 'decision' | 'key' }> = [];

  factChecks.forEach((fc) => {
    if (fc.timestamp) {
      markers.push({
        time: fc.timestamp,
        text: `Fakt: ${fc.claim} (${fc.verdict})`,
        type: 'fact',
      });
    }
  });

  decisions.forEach((d) => {
    if (d.timestamp) {
      markers.push({
        time: d.timestamp,
        text: `Qaror: ${d.decision}`,
        type: 'decision',
      });
    }
  });

  timestamps.forEach((t) => {
    if (!markers.some((m) => m.time === t.time)) {
      markers.push({
        time: t.time,
        text: t.text || 'Muhim lahza',
        type: 'key',
      });
    }
  });

  // Convert mm:ss to seconds
  const parseSeconds = (tStr: string) => {
    const parts = tStr.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  };

  const sortedMarkers = markers
    .map((m) => ({ ...m, seconds: parseSeconds(m.time) }))
    .sort((a, b) => a.seconds - b.seconds);

  const maxSeconds = Math.max(
    ...sortedMarkers.map((m) => m.seconds),
    300 // default 5 min if empty
  );

  return (
    <div className="space-y-4">
      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Tahliliy Xronologiya
            </span>
            <span className="text-xs font-bold text-slate-200">
              {sortedMarkers.length} ta asosiy nuqta aniqlandi
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Hissiy Barqarorlik
            </span>
            <span className="text-xs font-bold text-emerald-300">
              {result.sentiment || 'Xolis / Neytral'}
            </span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Davomiyligi
            </span>
            <span className="text-xs font-bold text-slate-200 font-mono">
              {result.metadata?.duration || 'To\'liq tahlil qamrovi'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Graph Card */}
      <div className="p-5 bg-[#070b16] rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-400" />
            Video Bo'ylab Hissiyot va Muhim Daqiqalar Grafigi
          </span>
          <span className="text-[11px] text-slate-500">
            Nuqtalar ustiga bosing — video o'sha daqiqaga o'tadi
          </span>
        </div>

        {/* SVG Waveform Chart */}
        <div className="relative pt-4 pb-2">
          <svg className="w-full h-24 overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gradientWave" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="gradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Base Grid Lines */}
            <line x1="0" y1="50" x2="1000" y2="50" stroke="#1e293b" strokeDasharray="4 4" strokeWidth="1" />
            <line x1="0" y1="90" x2="1000" y2="90" stroke="#334155" strokeWidth="1" />

            {/* Simulated Engagement Curve */}
            <path
              d="M 0 50 Q 150 20, 250 45 T 500 25 T 750 60 T 1000 40 L 1000 90 L 0 90 Z"
              fill="url(#gradientArea)"
            />
            <path
              d="M 0 50 Q 150 20, 250 45 T 500 25 T 750 60 T 1000 40"
              fill="none"
              stroke="url(#gradientWave)"
              strokeWidth="2.5"
            />

            {/* Markers on the Timeline */}
            {sortedMarkers.map((m, idx) => {
              const xPos = maxSeconds > 0 ? (m.seconds / maxSeconds) * 960 + 20 : 50;
              const yPos = 35 + ((idx * 17) % 30);
              const color =
                m.type === 'fact' ? '#10b981' : m.type === 'decision' ? '#3b82f6' : '#f59e0b';

              return (
                <g
                  key={idx}
                  className="cursor-pointer group"
                  onClick={() => onSeek && onSeek(m.time)}
                  onMouseEnter={() => setActivePin(m)}
                >
                  <line
                    x1={xPos}
                    y1={yPos}
                    x2={xPos}
                    y2="90"
                    stroke={color}
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.6"
                    className="group-hover:opacity-100 transition-opacity"
                  />
                  <circle
                    cx={xPos}
                    cy={yPos}
                    r="5"
                    fill={color}
                    className="group-hover:r-7 transition-all filter drop-shadow(0 0 6px ${color})"
                  />
                </g>
              );
            })}
          </svg>

          {/* Time Legend */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>00:00</span>
            <span>O'rtasi</span>
            <span>{result.metadata?.duration || 'Yakun'}</span>
          </div>
        </div>

        {/* Hovered Pin Info Box */}
        {activePin && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                ⏱️ {activePin.time}
              </span>
              <span className="text-slate-200">{activePin.text}</span>
            </div>
            <button
              onClick={() => onSeek && onSeek(activePin.time)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-[11px] shrink-0"
            >
              Ko'rish
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Faktlar & Da'volar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Qarorlar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Mavzu o'zgarishi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
