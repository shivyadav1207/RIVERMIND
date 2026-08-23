import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  AlertTriangle, 
  BarChart3, 
  Gauge, 
  Droplets, 
  Filter, 
  ChevronRight, 
  Radio, 
  Layers, 
  Info,
  TrendingUp,
  Search
} from 'lucide-react';
import { SEVERITY_COLORS } from '../utils/aggregation';

export default function Sidebar({
  isOpen,
  onClose,
  selectedState,
  onSelectState,
  onSelectStation,
  onResetMap,
  stateStats,
  hotspots,
  nationalSummary,
  selectedStation
}) {
  const [filterTier, setFilterTier] = useState('ALL'); // 'ALL' | 'Red' | 'Orange' | 'Yellow'
  const [searchFilter, setSearchFilter] = useState('');

  // Filter stations based on state and severity filter
  const visibleHotspots = hotspots.filter((h) => {
    if (selectedState && h.state_name !== selectedState) return false;
    if (filterTier !== 'ALL' && h.severity_level !== filterTier) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        h.location_details?.station_name?.toLowerCase().includes(q) ||
        h.location_details?.river?.toLowerCase().includes(q) ||
        h.state_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Ranked states sorted by Red count, Orange count, and Total count
  const rankedStates = Object.entries(stateStats)
    .filter(([, stats]) => stats.total > 0)
    .sort((a, b) => {
      const redDiff = (b[1].counts.Red || 0) - (a[1].counts.Red || 0);
      if (redDiff !== 0) return redDiff;
      const orangeDiff = (b[1].counts.Orange || 0) - (a[1].counts.Orange || 0);
      if (orangeDiff !== 0) return orangeDiff;
      return b[1].total - a[1].total;
    });

  const getTierBadge = (sev) => {
    switch (sev) {
      case 'Red':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Orange':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Yellow':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 z-20 w-80 sm:w-96 glass-panel border-r border-slate-800/80 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-base text-white tracking-tight">
            {selectedState ? `${selectedState} Hotspots` : 'Flood Severity Telemetry'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scope Header Card */}
      <div className="p-4 bg-slate-900/60 border-b border-slate-800/60">
        {selectedState ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> State Focus View
              </span>
              <button
                onClick={onResetMap}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline"
              >
                Back to National
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-white">{selectedState}</h3>
              {stateStats[selectedState] && (
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${getTierBadge(stateStats[selectedState].dominant)}`}>
                  Dominant: {stateStats[selectedState].dominant}
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                🔴 {stateStats[selectedState]?.counts.Red || 0} Red
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                🟠 {stateStats[selectedState]?.counts.Orange || 0} Orange
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                🟡 {stateStats[selectedState]?.counts.Yellow || 0} Yellow
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>National Overview</span>
              <span>22 Monitored States</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-red-400 font-extrabold text-lg">{nationalSummary?.redCount || 0}</div>
                <div className="text-[10px] text-slate-400 font-medium">Critical (Red)</div>
              </div>
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div className="text-orange-400 font-extrabold text-lg">{nationalSummary?.orangeCount || 0}</div>
                <div className="text-[10px] text-slate-400 font-medium">Moderate (Orange)</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="text-amber-400 font-extrabold text-lg">{nationalSummary?.yellowCount || 0}</div>
                <div className="text-[10px] text-slate-400 font-medium">Low (Yellow)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 border-b border-slate-800/80 space-y-2">
        {/* Tier filter pill buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-semibold">
          {['ALL', 'Red', 'Orange', 'Yellow'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`flex-1 py-1 px-2 rounded-lg transition text-center ${
                filterTier === tier
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tier === 'ALL' ? 'All Tiers' : tier}
            </button>
          ))}
        </div>

        {/* Local Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter list..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900/80 text-xs text-white placeholder-slate-500 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Content List: State Leaderboard OR Station Hotspots */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {selectedState ? (
          // Station Hotspots list for the selected state
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Gauges in {selectedState} ({visibleHotspots.length})
            </div>
            {visibleHotspots.map((h) => {
              const isSelected = selectedStation?.id === h.id || selectedStation?.station_name === h.location_details.station_name;
              return (
                <div
                  key={h.id || h.location_details.station_name}
                  onClick={() => onSelectStation(h)}
                  className={`p-3 rounded-xl border cursor-pointer transition glass-panel-hover ${
                    isSelected 
                      ? 'bg-blue-950/70 border-cyan-500/80 shadow-lg shadow-cyan-500/10' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-xs text-white leading-snug">
                        {h.location_details.station_name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        River: {h.location_details.river || 'Regional River'}
                      </p>
                    </div>
                    <span 
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getTierBadge(h.severity_level)}`}
                    >
                      {h.severity_level}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Gauge className="w-3 h-3 text-red-400" />
                      {h.location_details.peak_flood_level_m}m
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Droplets className="w-3 h-3 text-blue-400" />
                      {h.location_details.precipitation_mm}mm
                    </span>
                    <span className="text-cyan-400 font-semibold text-[10px]">
                      Inspect →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // State Leaderboard list
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              State Severity Leaderboard ({rankedStates.length} States)
            </div>
            {rankedStates.map(([stateName, stats], idx) => (
              <div
                key={stateName}
                onClick={() => onSelectState(stateName)}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:bg-slate-800/80 cursor-pointer transition glass-panel-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-white">{stateName}</h4>
                      <p className="text-[10px] text-slate-400">{stats.total} monitoring gauges</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-0.5 text-[10px] font-extrabold rounded-full"
                      style={{ 
                        backgroundColor: `${SEVERITY_COLORS[stats.dominant]}20`,
                        color: SEVERITY_COLORS[stats.dominant],
                        border: `1px solid ${SEVERITY_COLORS[stats.dominant]}40`
                      }}
                    >
                      {stats.dominant} Mode
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Sub-breakdown bar */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[10px]">
                  <span className="text-red-400 font-bold">🔴 {stats.counts.Red || 0}</span>
                  <span className="text-orange-400 font-bold">🟠 {stats.counts.Orange || 0}</span>
                  <span className="text-amber-400 font-bold">🟡 {stats.counts.Yellow || 0}</span>
                  <span className="ml-auto text-blue-400 font-semibold">Click to drill down</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span>RiverMind Geospatial Engine</span>
        <span className="text-cyan-400 font-mono">v2.4.0</span>
      </div>
    </aside>
  );
}
