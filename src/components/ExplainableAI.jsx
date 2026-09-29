import React from 'react';
import { Cpu, HelpCircle, Activity, Zap, CheckCircle2 } from 'lucide-react';

export default function ExplainableAI({ featureContributions = [], modelUsed = null }) {
  if (!featureContributions || featureContributions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800/90 p-4 shadow-xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Explainable AI (XAI) Feature Attribution
            </h4>
            <p className="text-[10px] text-slate-400">
              SHAP & tree-based hydrological weight contributions to this prediction
            </p>
          </div>
        </div>

        {modelUsed && (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {modelUsed.badge || 'AI Engine'}
          </span>
        )}
      </div>

      {/* Feature Progress Bars Grid */}
      <div className="space-y-2.5">
        {featureContributions.map((item, index) => {
          const isPrimary = index < 2;
          return (
            <div key={item.feature} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isPrimary ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                  {item.feature}
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isPrimary 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.impact}
                  </span>
                  <span className="font-bold text-white text-[11px] w-8 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPrimary
                      ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-md shadow-cyan-500/30'
                      : 'bg-gradient-to-r from-slate-600 to-indigo-600/70'
                  }`}
                  style={{ width: `${Math.min(100, item.percentage * 2.8)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Physics-Informed ML Note */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[10px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
        <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-300">Hydro-Meteorological AI Coupling: </span>
          The model couples 10-day antecedent rainfall dynamics with upstream morphometric catchment area and relief gradients to ensure predictions respect mass-balance continuity.
        </div>
      </div>
    </div>
  );
}
