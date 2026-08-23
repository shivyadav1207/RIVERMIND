import React, { useState } from 'react';
import { 
  Waves, 
  MapPin, 
  ChevronRight, 
  Search, 
  RotateCcw, 
  Layers, 
  Key, 
  Menu, 
  ShieldAlert,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { SEVERITY_COLORS } from '../utils/aggregation';

export default function Header({
  selectedState,
  onResetMap,
  nationalSummary,
  onSelectStation,
  onSelectState,
  allHotspots,
  allStates,
  isSidebarOpen,
  setIsSidebarOpen,
  onOpenTokenModal,
  hasCustomToken
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Search matches
  const filteredStations = searchQuery.trim().length >= 2
    ? allHotspots.filter((h) => 
        h.location_details?.station_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.state_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.location_details?.river?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const filteredStates = searchQuery.trim().length >= 2
    ? allStates.filter((s) => 
        s.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 glass-panel border-b border-slate-800/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-white transition border border-slate-700/50"
          title="Toggle Analytics Drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                River<span className="text-cyan-400">Mind</span>
              </span>
              <span className="hidden md:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/10 text-cyan-400 border border-cyan-500/20">
                GEO-SEVERITY 2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block -mt-0.5">
              Multi-Tier Flood Severity Hotspot Analyzer
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Breadcrumb / Scope Indicator & Search */}
      <div className="hidden lg:flex items-center gap-3 max-w-xl flex-1 justify-center">
        {/* Breadcrumb Capsule */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
          <button 
            onClick={onResetMap}
            className={`font-medium transition hover:text-cyan-400 ${!selectedState ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
          >
            India (National)
          </button>
          {selectedState && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-400" />
                {selectedState}
              </span>
            </>
          )}
        </div>

        {/* Quick Search */}
        <div className="relative w-64">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search station, river, state..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full bg-slate-900/90 text-xs text-white placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-full border border-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {showSearchResults && (filteredStations.length > 0 || filteredStates.length > 0) && (
            <div className="absolute top-9 left-0 right-0 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs backdrop-blur-md">
              {filteredStates.length > 0 && (
                <div className="mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-2">States</span>
                  {filteredStates.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onSelectState(st);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                    >
                      <span className="font-semibold">{st}</span>
                      <span className="text-[10px] text-blue-400">Drill into state →</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredStations.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Monitoring Stations</span>
                  {filteredStations.map((h) => (
                    <button
                      key={h.id || h.location_details.station_name}
                      onClick={() => {
                        onSelectStation(h);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-white flex items-center justify-between"
                    >
                      <div>
                        <span className="font-medium text-white">{h.location_details.station_name}</span>
                        <span className="text-slate-400 text-[10px] ml-1.5">({h.state_name})</span>
                      </div>
                      <span 
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${SEVERITY_COLORS[h.severity_level]}20`,
                          color: SEVERITY_COLORS[h.severity_level] 
                        }}
                      >
                        {h.severity_level}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Telemetry Quick Chips & Mapbox Token Key */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Metric Badges */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs">
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold"
            title="High Severity Hotspots"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>{nationalSummary?.redCount || 0}</span>
            <span className="hidden md:inline text-[10px] font-normal text-slate-400">Critical</span>
          </div>

          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold"
            title="Moderate Severity Hotspots"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>{nationalSummary?.orangeCount || 0}</span>
            <span className="hidden md:inline text-[10px] font-normal text-slate-400">Moderate</span>
          </div>

          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold"
            title="Low Severity Hotspots"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>{nationalSummary?.yellowCount || 0}</span>
            <span className="hidden md:inline text-[10px] font-normal text-slate-400">Low</span>
          </div>
        </div>

        {/* Mapbox Token Modal Button */}
        <button
          onClick={onOpenTokenModal}
          className={`p-2 rounded-xl text-xs flex items-center gap-1.5 transition border ${
            hasCustomToken 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/80'
          }`}
          title="Mapbox Access Token / Tile Settings"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden xl:inline font-medium">
            {hasCustomToken ? 'Mapbox Active' : 'Map Settings'}
          </span>
        </button>
      </div>
    </header>
  );
}
