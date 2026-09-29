import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';

export default function HydrographChart({ 
  hydrograph = [], 
  predictedPeakLevel, 
  warningLevel, 
  dangerLevel, 
  timeToPeakHours,
  severityColor = '#ef4444' 
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!hydrograph || hydrograph.length === 0) {
    return (
      <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
        No hydrograph trajectory data available
      </div>
    );
  }

  // Calculate chart boundaries
  const allStages = hydrograph.map((p) => p.stage);
  const minVal = Math.floor(Math.min(...allStages, warningLevel ? warningLevel - 2 : 0, 0));
  const maxVal = Math.ceil(Math.max(...allStages, dangerLevel ? dangerLevel + 1.5 : 10, predictedPeakLevel + 1.0));
  const range = Math.max(1, maxVal - minVal);

  const chartWidth = 700;
  const chartHeight = 240;
  const padding = { top: 25, right: 35, bottom: 40, left: 55 };

  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Coordinate mapper functions
  const getX = (index) => {
    return padding.left + (index / (hydrograph.length - 1)) * innerWidth;
  };

  const getY = (val) => {
    const norm = (val - minVal) / range;
    return padding.top + (1 - norm) * innerHeight;
  };

  // Generate SVG path data for smooth curve
  const points = hydrograph.map((p, i) => `${getX(i)},${getY(p.stage)}`);
  const pathD = `M ${points.join(' L ')}`;

  // Closed area path for gradient fill
  const areaD = `M ${getX(0)},${getY(minVal)} L ${points.join(' L ')} L ${getX(hydrograph.length - 1)},${getY(minVal)} Z`;

  const warningY = warningLevel ? getY(warningLevel) : null;
  const dangerY = dangerLevel ? getY(dangerLevel) : null;

  // Find peak point index
  const peakIndex = hydrograph.findIndex((p) => p.isPeak);
  const peakPoint = peakIndex >= 0 ? hydrograph[peakIndex] : hydrograph[Math.floor(hydrograph.length / 3)];
  const peakX = peakIndex >= 0 ? getX(peakIndex) : getX(Math.floor(hydrograph.length / 3));
  const peakY = peakPoint ? getY(peakPoint.stage) : getY(predictedPeakLevel);

  return (
    <div className="relative w-full rounded-2xl bg-slate-900/80 border border-slate-800/90 p-4 shadow-xl backdrop-blur-md">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              10-Day AI Simulated Hydrograph Trajectory
            </h4>
            <p className="text-[10px] text-slate-400">
              River water stage (m) time-series forecasting rising and recession limbs
            </p>
          </div>
        </div>

        {/* Legend Indicators */}
        <div className="flex items-center gap-3 text-[10px] font-medium">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-3 h-0.5 bg-red-500 border-b border-dashed border-red-400" />
            Danger Level ({dangerLevel}m)
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-3 h-0.5 bg-amber-500 border-b border-dashed border-amber-400" />
            Warning Level ({warningLevel}m)
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            Forecast Stage
          </span>
        </div>
      </div>

      {/* SVG Responsive Container */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[500px] select-none"
        >
          <defs>
            {/* Stage Area Gradient */}
            <linearGradient id="hydrographGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.0" />
            </linearGradient>

            {/* Peak Glow Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Lines & Y-Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const val = minVal + ratio * range;
            const y = getY(val);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  strokeOpacity="0.5"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {val.toFixed(1)}m
                </text>
              </g>
            );
          })}

          {/* Warning Level Horizontal Line */}
          {warningY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={warningY}
                x2={chartWidth - padding.right}
                y2={warningY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeOpacity="0.85"
              />
              <text
                x={chartWidth - padding.right + 4}
                y={warningY + 3}
                fill="#f59e0b"
                fontSize="8"
                fontWeight="bold"
              >
                WARN
              </text>
            </g>
          )}

          {/* Danger Level Horizontal Line */}
          {dangerY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={dangerY}
                x2={chartWidth - padding.right}
                y2={dangerY}
                stroke="#ef4444"
                strokeWidth="1.8"
                strokeDasharray="5 3"
                strokeOpacity="0.9"
              />
              <text
                x={chartWidth - padding.right + 4}
                y={dangerY + 3}
                fill="#ef4444"
                fontSize="8"
                fontWeight="bold"
              >
                DANGER
              </text>
            </g>
          )}

          {/* Area Fill */}
          <path d={areaD} fill="url(#hydrographGradient)" />

          {/* Main Trajectory Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />

          {/* X-Axis Labels (Time) */}
          {hydrograph.map((p, i) => {
            // Show every 3rd or 4th label to prevent crowding
            if (i % 4 !== 0 && i !== hydrograph.length - 1 && !p.isPeak) return null;
            const x = getX(i);
            const y = chartHeight - 12;
            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="8.5"
                fontFamily="sans-serif"
              >
                {p.label}
              </text>
            );
          })}

          {/* Interactive Hoverable Points */}
          {hydrograph.map((p, i) => {
            const x = getX(i);
            const y = getY(p.stage);
            const isHovered = hoveredPoint?.index === i;

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={p.isPeak ? 5.5 : (isHovered ? 4.5 : 2.5)}
                  fill={p.isPeak ? severityColor : '#06b6d4'}
                  stroke="#ffffff"
                  strokeWidth={p.isPeak ? 2 : 1}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint({ ...p, index: i, x, y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}

          {/* Peak Flood Crest Marker Annotation */}
          {peakPoint && (
            <g>
              <line
                x1={peakX}
                y1={peakY}
                x2={peakX}
                y2={padding.top - 5}
                stroke={severityColor}
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
              <rect
                x={peakX - 45}
                y={padding.top - 18}
                width="90"
                height="16"
                rx="4"
                fill="#0f172a"
                stroke={severityColor}
                strokeWidth="1"
              />
              <text
                x={peakX}
                y={padding.top - 7}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="8.5"
                fontWeight="bold"
              >
                Peak: {predictedPeakLevel.toFixed(2)}m
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Floating Tooltip when hovering over a point */}
      {hoveredPoint && (
        <div 
          className="absolute z-20 pointer-events-none px-2.5 py-1.5 rounded-lg bg-slate-950/95 border border-cyan-500/50 text-white text-[11px] shadow-2xl backdrop-blur-md"
          style={{
            left: `${Math.min(Math.max(hoveredPoint.x, 80), chartWidth - 100)}px`,
            top: `${Math.max(10, hoveredPoint.y - 45)}px`
          }}
        >
          <div className="font-bold text-cyan-400">{hoveredPoint.label}</div>
          <div className="text-slate-200">Stage: <span className="font-mono font-bold text-white">{hoveredPoint.stage}m</span></div>
          {dangerLevel && (
            <div className="text-[10px] text-slate-400">
              {hoveredPoint.stage >= dangerLevel 
                ? <span className="text-red-400 font-semibold">+{(hoveredPoint.stage - dangerLevel).toFixed(2)}m above Danger</span>
                : <span className="text-emerald-400">{(dangerLevel - hoveredPoint.stage).toFixed(2)}m below Danger</span>
              }
            </div>
          )}
        </div>
      )}

      {/* Footer Timing Summary */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Estimated Crest Lead Time: <strong className="text-white">~{timeToPeakHours} Hours</strong></span>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span>Warning Stage: <strong className="text-amber-400">{warningLevel}m</strong></span>
          <span>•</span>
          <span>Danger Stage: <strong className="text-red-400">{dangerLevel}m</strong></span>
        </div>
      </div>
    </div>
  );
}
