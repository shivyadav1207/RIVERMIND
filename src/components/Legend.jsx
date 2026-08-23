import React, { useState } from 'react';
import { Layers, Info, ChevronDown, ChevronUp, AlertCircle, CircleDot } from 'lucide-react';
import { SEVERITY_COLORS } from '../utils/aggregation';

export default function Legend({ selectedState, totalHotspots, stateDominantInfo }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="glass-panel p-3.5 sm:p-4 rounded-2xl text-slate-200 text-xs w-[280px] sm:w-[320px] transition-all duration-300">
      {/* Legend Header */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-sm tracking-wide text-white">
            {selectedState ? 'Micro-View Hotspot Legend' : 'Macro-View Severity Legend'}
          </span>
        </div>
        <button className="text-slate-400 hover:text-white p-1">
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3 animate-in fade-in duration-200">
          {/* Active View Indicator */}
          <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Current Scope:</span>
            <span className="font-semibold px-2 py-0.5 rounded text-white bg-blue-500/20 border border-blue-500/30">
              {selectedState ? `State Focus (${selectedState})` : 'National State Choropleth'}
            </span>
          </div>

          {/* Severity Levels List */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {selectedState ? 'Hotspot Severity Levels (Individual Gauges)' : 'Dominant State Severity (Mode with Tie-Breaker)'}
            </div>

            {/* Red */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: SEVERITY_COLORS.Red, boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)' }} />
                <span className="font-medium text-slate-200">Red Tier</span>
              </div>
              <span className="text-red-400 font-semibold text-[11px]">High Danger / Critical</span>
            </div>

            {/* Orange */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: SEVERITY_COLORS.Orange, boxShadow: '0 0 10px rgba(249, 115, 22, 0.5)' }} />
                <span className="font-medium text-slate-200">Orange Tier</span>
              </div>
              <span className="text-orange-400 font-semibold text-[11px]">Moderate Danger</span>
            </div>

            {/* Yellow */}
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 transition">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: SEVERITY_COLORS.Yellow, boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)' }} />
                <span className="font-medium text-slate-200">Yellow Tier</span>
              </div>
              <span className="text-amber-400 font-semibold text-[11px]">Low Danger / Watch</span>
            </div>

            {!selectedState && (
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 transition">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: SEVERITY_COLORS.None, boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)' }} />
                  <span className="font-medium text-slate-200">Green Tier</span>
                </div>
                <span className="text-emerald-400 font-semibold text-[11px]">Neutral / No Danger</span>
              </div>
            )}
          </div>

          {/* Logic Explanation Box */}
          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
            <span>
              {selectedState 
                ? 'Click any circular gauge hotspot to inspect peak water levels, danger thresholds, and precipitation.'
                : 'Click any state to trigger camera zoom and reveal individual flood gauge scatterplot hotspots.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
