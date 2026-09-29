import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Search, 
  MapPin, 
  Gauge, 
  Droplets, 
  CloudLightning, 
  ShieldAlert, 
  SlidersHorizontal, 
  Play, 
  RotateCcw, 
  ArrowUpRight, 
  CheckCircle2, 
  Flame, 
  AlertTriangle,
  Info,
  Clock,
  Waves,
  Zap,
  Cpu,
  TrendingUp,
  Brain,
  CloudRain
} from 'lucide-react';
import { 
  predictFloodRisk, 
  STATIONS_CATALOG, 
  AVAILABLE_MODELS, 
  SCENARIO_PRESETS 
} from '../utils/aiPredictorEngine';
import HydrographChart from './HydrographChart';
import ExplainableAI from './ExplainableAI';
import { SEVERITY_COLORS } from '../utils/aggregation';

export default function PredictorStudio({ defaultStation = null }) {
  const allStations = useMemo(() => Object.values(STATIONS_CATALOG), []);

  // Station Selection
  const [selectedStationName, setSelectedStationName] = useState(() => {
    if (defaultStation?.station_name && STATIONS_CATALOG[defaultStation.station_name]) {
      return defaultStation.station_name;
    }
    // Default to a prominent station like Guwahati, Patna, or first available
    return allStations.find(s => s.station_name?.includes('Guwahati') || s.station_name?.includes('Patna'))?.station_name || allStations[0]?.station_name;
  });

  const [stationSearch, setStationSearch] = useState('');
  const [showStationDropdown, setShowStationDropdown] = useState(false);

  // Model Selection
  const [selectedModelId, setSelectedModelId] = useState('ensemble');

  // Meteorological & Catchment Inputs
  const [rainfall, setRainfall] = useState({
    t1d: 65,
    t2d: 110,
    t3d: 160,
    t4d: 195,
    t5d: 230,
    t7d: 280,
    t10d: 320
  });

  const [soilMoisture, setSoilMoisture] = useState(78); // percentage 0-100
  const [currentStageInput, setCurrentStageInput] = useState('');
  const [activePreset, setActivePreset] = useState('custom');

  // Get active station object
  const currentStation = useMemo(() => {
    return STATIONS_CATALOG[selectedStationName] || allStations[0];
  }, [selectedStationName, allStations]);

  // Sync if defaultStation changes from parent
  useEffect(() => {
    if (defaultStation?.station_name && STATIONS_CATALOG[defaultStation.station_name]) {
      setSelectedStationName(defaultStation.station_name);
    }
  }, [defaultStation]);

  // Run AI Inference
  const predictionResult = useMemo(() => {
    if (!currentStation) return null;
    const currentStageVal = currentStageInput !== '' ? parseFloat(currentStageInput) : null;
    return predictFloodRisk({
      station: currentStation,
      rainfall,
      modelId: selectedModelId,
      soilMoisture,
      currentStage: currentStageVal
    });
  }, [currentStation, rainfall, selectedModelId, soilMoisture, currentStageInput]);

  // Filtered station search
  const filteredStationList = useMemo(() => {
    if (!stationSearch.trim()) return allStations.slice(0, 15);
    const q = stationSearch.toLowerCase();
    return allStations.filter(s => 
      s.station_name?.toLowerCase().includes(q) ||
      s.river?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q) ||
      s.basin?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [stationSearch, allStations]);

  // Apply scenario preset
  const handleApplyPreset = (preset) => {
    setActivePreset(preset.id);
    setRainfall({
      t1d: preset.rain_1d,
      t2d: preset.rain_2d,
      t3d: preset.rain_3d,
      t4d: Math.round(preset.rain_3d * 1.15),
      t5d: preset.rain_5d,
      t7d: preset.rain_7d,
      t10d: preset.rain_10d
    });
    setSoilMoisture(preset.soil_moisture ?? preset.soilMoisture ?? 70);
  };

  const pred = predictionResult?.prediction;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Studio Controls: Station Picker & Model Selector */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-2xl backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Station & Basin Picker */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Target River Monitoring Station
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                {allStations.length} Gauges Available
              </span>
            </div>

            {/* Custom Autocomplete Input */}
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder={currentStation ? `${currentStation.station_name} (${currentStation.state})` : "Search station, river, state..."}
                  value={stationSearch}
                  onChange={(e) => {
                    setStationSearch(e.target.value);
                    setShowStationDropdown(true);
                  }}
                  onFocus={() => setShowStationDropdown(true)}
                  className="w-full bg-slate-950/90 text-xs text-white placeholder-slate-400 pl-9 pr-8 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showStationDropdown && (
                <div className="absolute top-11 left-0 right-0 z-50 bg-slate-950 border border-slate-700/90 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2 backdrop-blur-xl divide-y divide-slate-800/60">
                  {filteredStationList.map((st) => (
                    <button
                      key={st.gauge_id || st.station_name}
                      onClick={() => {
                        setSelectedStationName(st.station_name);
                        setStationSearch('');
                        setShowStationDropdown(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-xs text-white">
                          {st.station_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          River: {st.river} • State: {st.state}
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono text-cyan-400 font-bold shrink-0">
                        Danger: {st.danger_level_m}m
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Active Station Morphometry Card */}
            {currentStation && (
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">River Basin</span>
                  <div className="font-bold text-white truncate">{currentStation.basin}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Catchment Area</span>
                  <div className="font-bold text-white font-mono">{currentStation.drainage_area_km2?.toLocaleString()} km²</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Warning Level</span>
                  <div className="font-bold text-amber-400 font-mono">{currentStation.warning_level_m}m</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Danger Level</span>
                  <div className="font-bold text-red-400 font-mono">{currentStation.danger_level_m}m</div>
                </div>
              </div>
            )}
          </div>

          {/* Right: AI Model Architecture Selector */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                Select AI / ML Prediction Architecture
              </label>
              <span className="text-[10px] text-cyan-400 font-semibold">
                Instant Real-Time Mathematical Inference
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_MODELS.map((m) => {
                const isSelected = m.id === selectedModelId;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModelId(m.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-950/90 to-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                        <span className="font-bold text-xs text-white">{m.name}</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-cyan-300">
                        {m.accuracy}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                      {m.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Meteorological Scenario Sliders & Presets */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              2. Meteorological & Catchment Forecast Inputs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adjust antecedent rainfall trajectory (T1d - T10d) or apply extreme weather stress presets
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition border ${
                  activePreset === preset.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/60'
                }`}
              >
                {preset.name.split('/')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* 24h Rainfall (T1d) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                24h Forecast (T1d)
              </span>
              <span className="font-mono font-bold text-cyan-400 text-sm">{rainfall.t1d} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={rainfall.t1d}
              onChange={(e) => {
                setActivePreset('custom');
                const val = Number(e.target.value);
                setRainfall(prev => ({
                  ...prev,
                  t1d: val,
                  t2d: Math.max(prev.t2d, Math.round(val * 1.5)),
                  t3d: Math.max(prev.t3d, Math.round(val * 1.9))
                }));
              }}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0mm (Dry)</span>
              <span>100mm (Heavy)</span>
              <span>200mm (Cloudburst)</span>
            </div>
          </div>

          {/* 72h Rainfall (T3d) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-indigo-400" />
                72h Cumulative (T3d)
              </span>
              <span className="font-mono font-bold text-indigo-400 text-sm">{rainfall.t3d} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="350"
              step="10"
              value={rainfall.t3d}
              onChange={(e) => {
                setActivePreset('custom');
                const val = Number(e.target.value);
                setRainfall(prev => ({
                  ...prev,
                  t3d: val,
                  t7d: Math.max(prev.t7d, Math.round(val * 1.4))
                }));
              }}
              className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0mm</span>
              <span>175mm</span>
              <span>350mm</span>
            </div>
          </div>

          {/* 7-Day Cumulative (T7d) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-300" />
                7-Day Cumulative (T7d)
              </span>
              <span className="font-mono font-bold text-cyan-300 text-sm">{rainfall.t7d} mm</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={rainfall.t7d}
              onChange={(e) => {
                setActivePreset('custom');
                setRainfall(prev => ({ ...prev, t7d: Number(e.target.value) }));
              }}
              className="w-full accent-cyan-300 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0mm</span>
              <span>250mm</span>
              <span>500mm (Monsoon Surge)</span>
            </div>
          </div>
        </div>

        {/* Catchment Moisture Slider & River Stage Override */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Antecedent Catchment Soil Moisture</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{soilMoisture}% Saturation</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="2"
              value={soilMoisture}
              onChange={(e) => {
                setActivePreset('custom');
                setSoilMoisture(Number(e.target.value));
              }}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>10% (Dry Basin)</span>
              <span>50% (Normal)</span>
              <span>100% (Fully Saturated)</span>
            </div>
          </div>

          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Current River Stage (Optional Override)</span>
              <span className="text-[10px] text-slate-400">Default: Automated Baseflow</span>
            </div>
            <input
              type="number"
              placeholder={`Auto-computed (~${(currentStation.warning_level_m - 2.5).toFixed(1)}m)`}
              value={currentStageInput}
              onChange={(e) => setCurrentStageInput(e.target.value)}
              className="w-full bg-slate-900 text-xs text-white placeholder-slate-500 px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* AI Inference Intelligence Dashboard */}
      {pred && (
        <div className="space-y-6">
          {/* Main Prediction Highlight Banner */}
          <div 
            className="rounded-3xl border p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl"
            style={{
              borderColor: `${pred.severityColor}60`,
              backgroundColor: `${pred.severityColor}10`
            }}
          >
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Severity & Crest Output */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-md flex items-center gap-1.5"
                    style={{
                      backgroundColor: `${pred.severityColor}25`,
                      color: pred.severityColor,
                      borderColor: `${pred.severityColor}60`
                    }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: pred.severityColor }} />
                    {pred.severityTier} RISK INUNDATION
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    {predictionResult.modelUsed.name}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
                    {pred.predictedPeakLevel.toFixed(2)}m
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    Predicted Peak Stage
                  </span>
                  <span 
                    className="text-sm font-bold font-mono px-2 py-0.5 rounded-lg border"
                    style={{
                      color: pred.exceedanceM >= 0 ? '#ef4444' : '#10b981',
                      backgroundColor: pred.exceedanceM >= 0 ? '#ef444415' : '#10b98115',
                      borderColor: pred.exceedanceM >= 0 ? '#ef444440' : '#10b98140'
                    }}
                  >
                    {pred.exceedanceM >= 0 
                      ? `+${pred.exceedanceM.toFixed(2)}m Above Danger Mark (${currentStation.danger_level_m}m)`
                      : `${Math.abs(pred.exceedanceM).toFixed(2)}m Below Danger Mark`
                    }
                  </span>
                </div>
              </div>

              {/* Quick Telemetry KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
                {/* Confidence */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[110px]">
                  <div className="text-xl font-black text-cyan-400 font-mono">
                    {pred.confidenceScore}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    AI Confidence
                  </div>
                </div>

                {/* Inundation Probability */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[110px]">
                  <div 
                    className="text-xl font-black font-mono"
                    style={{ color: pred.severityColor }}
                  >
                    {pred.inundationProbability}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Overflow Risk
                  </div>
                </div>

                {/* Peak Discharge */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center col-span-2 sm:col-span-1 min-w-[110px]">
                  <div className="text-xl font-black text-indigo-300 font-mono">
                    {pred.estimatedDischargeCumec.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Peak Q (m³/s)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Emergency Advisory Card */}
          {predictionResult.emergencyAdvisory && (
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${predictionResult.emergencyAdvisory.badgeColor}`}>
                  {predictionResult.emergencyAdvisory.alertLevel}
                </span>
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  {predictionResult.emergencyAdvisory.leadTimeText}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">
                {predictionResult.emergencyAdvisory.headline}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {predictionResult.emergencyAdvisory.summary}
              </p>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Recommended Emergency Action Plan:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {predictionResult.emergencyAdvisory.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-slate-300 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hydrograph Chart & Explainable AI Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <HydrographChart
                hydrograph={predictionResult.hydrograph}
                predictedPeakLevel={pred.predictedPeakLevel}
                warningLevel={pred.warningLevel}
                dangerLevel={pred.dangerLevel}
                timeToPeakHours={pred.timeToPeakHours}
                severityColor={pred.severityColor}
              />
            </div>

            <div className="lg:col-span-5">
              <ExplainableAI
                featureContributions={predictionResult.featureContributions}
                modelUsed={predictionResult.modelUsed}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
