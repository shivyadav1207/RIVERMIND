import React from 'react';
import { AlertTriangle, Droplets, Gauge, ShieldCheck, MapPin, Waves } from 'lucide-react';
import { SEVERITY_COLORS } from '../utils/aggregation';

export default function StationPopup({ details, onClose }) {
  if (!details) return null;

  const sevColor = SEVERITY_COLORS[details.severity_level] || '#eab308';
  
  const getBadgeStyle = (sev) => {
    switch (sev) {
      case 'Red':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Orange':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'Yellow':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getRiskLabel = (sev) => {
    switch (sev) {
      case 'Red': return 'CRITICAL DANGER';
      case 'Orange': return 'HIGH MODERATE RISK';
      case 'Yellow': return 'ELEVATED / LOW RISK';
      default: return 'MONITORED';
    }
  };

  return (
    <div className="w-[310px] sm:w-[340px] bg-slate-900/95 text-slate-100 p-4 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>{details.state || details.state_name}</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight mt-0.5 leading-snug">
            {details.station_name}
          </h3>
        </div>

        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border shrink-0 ${getBadgeStyle(details.severity_level)}`}>
          {details.severity_level}
        </span>
      </div>

      {/* Severity Alert banner */}
      <div 
        className="mt-3 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium"
        style={{ backgroundColor: `${sevColor}15`, border: `1px solid ${sevColor}35`, color: sevColor }}
      >
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Status: <strong>{getRiskLabel(details.severity_level)}</strong></span>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs">
        {/* Peak Flood Level */}
        <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Gauge className="w-3.5 h-3.5 text-red-400" />
            <span>Peak Flood Level</span>
          </div>
          <p className="text-base font-bold text-white font-mono">
            {details.peak_flood_level_m ? `${details.peak_flood_level_m} m` : 'N/A'}
          </p>
        </div>

        {/* Danger Level */}
        <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Danger Level</span>
          </div>
          <p className="text-base font-bold text-white font-mono">
            {details.danger_level_m ? `${details.danger_level_m} m` : 'N/A'}
          </p>
        </div>

        {/* Precipitation */}
        <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>Precipitation</span>
          </div>
          <p className="text-base font-bold text-white font-mono">
            {details.precipitation_mm ? `${details.precipitation_mm} mm` : '0.0 mm'}
          </p>
        </div>

        {/* Calculated Risk */}
        <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/40">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <span>Risk Score</span>
          </div>
          <p className="text-base font-bold text-cyan-300 font-mono">
            {details.calculated_risk_score || 'Normal'}
          </p>
        </div>
      </div>

      {/* River & Basin Info */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-400">River / Tributary:</span>
          <span className="font-medium text-slate-200 truncate max-w-[180px] text-right" title={details.river}>
            {details.river || 'Regional Stream'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Basin:</span>
          <span className="font-medium text-slate-200 truncate max-w-[180px] text-right" title={details.basin}>
            {details.basin || 'Regional Basin'}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1">
          <span className="text-slate-400">Rainfall Tier:</span>
          <span className="font-semibold text-blue-300 uppercase text-[11px] px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/20">
            {details.rain_tier || 'Moderate'}
          </span>
        </div>
      </div>

      {/* Reliability & Coords */}
      <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Reliability: {details.reliability || 'Safe'}
        </span>
        <span className="font-mono text-slate-400">
          {details.latitude ? Number(details.latitude).toFixed(2) : ''}°, {details.longitude ? Number(details.longitude).toFixed(2) : ''}°
        </span>
      </div>

      {/* AI Prediction Studio Quick Launch Button */}
      {details && (
        <div className="mt-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              if (onClose) onClose();
              if (details.onRunPrediction) {
                details.onRunPrediction(details);
              }
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-1.5"
          >
            <span>🔮 Run AI Hydro-Prediction Studio</span>
          </button>
        </div>
      )}
    </div>
  );
}
