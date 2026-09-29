import React, { useState, useMemo } from 'react';
import { 
  CloudLightning, 
  Wind, 
  CloudRain, 
  Droplets, 
  Play, 
  AlertTriangle, 
  MapPin, 
  Gauge, 
  CheckCircle2, 
  Flame,
  ArrowRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { 
  SCENARIO_PRESETS, 
  batchSimulateScenario, 
  STATIONS_CATALOG,
  AVAILABLE_MODELS
} from '../utils/aiPredictorEngine';
import { SEVERITY_COLORS } from '../utils/aggregation';

export default function ScenarioTester({ onSelectStationForStudio }) {
  const [selectedPresetId, setSelectedPresetId] = useState('monsoon_cloudburst');
  const [selectedModelId, setSelectedModelId] = useState('ensemble');
  const [searchStation, setSearchStation] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');

  const selectedPreset = useMemo(() => {
    return SCENARIO_PRESETS.find((p) => p.id === selectedPresetId) || SCENARIO_PRESETS[0];
  }, [selectedPresetId]);

  // Run Batch Simulation
  const simulationResults = useMemo(() => {
    return batchSimulateScenario({
      scenarioPreset: selectedPreset,
      modelId: selectedModelId
    });
  }, [selectedPreset, selectedModelId]);

  // Filtered station list
  const filteredStations = useMemo(() => {
    return simulationResults.stationResults.filter((res) => {
      const tier = res.prediction.severityTier;
      if (filterSeverity !== 'ALL' && tier !== filterSeverity) return false;
      if (searchStation.trim()) {
        const q = searchStation.toLowerCase();
        const st = res.station;
        return (
          st.station_name?.toLowerCase().includes(q) ||
          st.river?.toLowerCase().includes(q) ||
          st.state?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [simulationResults, filterSeverity, searchStation]);

  const getPresetIcon = (iconName) => {
    switch (iconName) {
      case 'CloudLightning': return <CloudLightning className="w-5 h-5 text-amber-400" />;
      case 'Wind': return <Wind className="w-5 h-5 text-cyan-400" />;
      case 'CloudRain': return <CloudRain className="w-5 h-5 text-blue-400" />;
      default: return <Droplets className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Scenario Presets Selector Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              1. Select Meteorological Stress Scenario
            </h3>
            <p className="text-xs text-slate-400">
              Trigger instant batch AI inference across all 214 Indian river monitoring stations
            </p>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Engine:</span>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="bg-slate-800 text-xs text-white border border-slate-700 rounded-xl px-2.5 py-1.5 focus:border-cyan-400 focus:outline-none"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <div
                key={preset.id}
                onClick={() => setSelectedPresetId(preset.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-b from-blue-950/80 to-slate-900/90 border-cyan-400/80 shadow-lg shadow-cyan-500/15 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
                    {getPresetIcon(preset.icon)}
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-white leading-tight">
                  {preset.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {preset.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">
                    24h: <strong className="text-cyan-400">{preset.rain_1d}mm</strong>
                  </span>
                  <span className="text-slate-300">
                    7d: <strong className="text-indigo-300">{preset.rain_7d}mm</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Telemetry Overview Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/60 border border-slate-800 p-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              National Stress Test Impact ({simulationResults.totalStations} Gauges Simulated)
            </span>
            <div className="text-base font-extrabold text-white mt-0.5">
              {selectedPreset.name} Simulation Outcome
            </div>
          </div>

          {/* Impact Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{simulationResults.criticalCount} Critical Breaches</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>{simulationResults.moderateCount} Moderate Watches</span>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{simulationResults.lowCount} Safe / Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* State Breakdown & Station Inundation Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: State Risk Summary */}
        <div className="lg:col-span-1 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Top Vulnerable States Under Scenario
          </h4>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {Object.entries(simulationResults.stateSummary)
              .sort((a, b) => (b[1].Critical * 3 + b[1].Moderate) - (a[1].Critical * 3 + a[1].Moderate))
              .map(([stateName, counts]) => (
                <div 
                  key={stateName}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-xs text-white">{stateName}</div>
                    <div className="text-[10px] text-slate-400">{counts.total} gauges monitored</div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                      🔴 {counts.Critical}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                      🟠 {counts.Moderate}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Column: Station Inundation Leaderboard */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-xl flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Station Inundation Risk Ranking ({filteredStations.length})
              </h4>
              <p className="text-[11px] text-slate-400">
                Sorted by highest predicted stage exceedance above danger level
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-slate-800 text-xs text-white border border-slate-700 rounded-xl px-2.5 py-1 focus:outline-none"
              >
                <option value="ALL">All Tiers</option>
                <option value="Critical">Critical Only</option>
                <option value="Moderate">Moderate Only</option>
                <option value="Low">Low Only</option>
              </select>

              <input
                type="text"
                placeholder="Search station..."
                value={searchStation}
                onChange={(e) => setSearchStation(e.target.value)}
                className="w-36 bg-slate-800 text-xs text-white placeholder-slate-500 px-3 py-1 rounded-xl border border-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Station Table */}
          <div className="flex-1 overflow-y-auto max-h-[440px] space-y-2 pr-1">
            {filteredStations.map((res) => {
              const st = res.station;
              const pred = res.prediction;
              const isCritical = pred.severityTier === 'Critical';

              return (
                <div
                  key={st.gauge_id || st.station_name}
                  className={`p-3 rounded-xl border transition-all ${
                    isCritical
                      ? 'bg-red-950/20 border-red-500/30 hover:bg-red-950/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {st.station_name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({st.state})
                        </span>
                        <span 
                          className="text-[9px] font-extrabold px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: `${SEVERITY_COLORS[pred.severityTier]}20`,
                            color: SEVERITY_COLORS[pred.severityTier],
                            border: `1px solid ${SEVERITY_COLORS[pred.severityTier]}40`
                          }}
                        >
                          {pred.severityTier}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        River: {st.river} • Basin: {st.basin}
                      </p>
                    </div>

                    {/* Metrics & Drilldown Button */}
                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-[11px]">
                        <div className="text-white font-bold">
                          Stage: {pred.predictedPeakLevel}m
                        </div>
                        <div className={pred.exceedanceM >= 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                          {pred.exceedanceM >= 0 ? `+${pred.exceedanceM}m over Danger` : `${pred.exceedanceM}m below Danger`}
                        </div>
                      </div>

                      {onSelectStationForStudio && (
                        <button
                          onClick={() => onSelectStationForStudio(st)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                          title="Open in AI Prediction Studio"
                        >
                          <span>Simulate</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
