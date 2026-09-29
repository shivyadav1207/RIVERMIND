import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Target, 
  Cpu, 
  ShieldCheck, 
  Database,
  Award,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { 
  AI_METADATA, 
  CLASSIFICATION_BENCHMARKS, 
  REGRESSION_BENCHMARKS, 
  FEATURE_IMPORTANCES, 
  AVAILABLE_MODELS 
} from '../utils/aiPredictorEngine';

export default function ModelBenchmarks() {
  const [activeTab, setActiveTab] = useState('models'); // 'models' | 'features' | 'datasets' | 'matrix'
  const [selectedClfModel, setSelectedClfModel] = useState('Stacking Ensemble Engine');

  const clfData = CLASSIFICATION_BENCHMARKS[selectedClfModel] || CLASSIFICATION_BENCHMARKS['Stacking Ensemble Engine'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Training Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-indigo-950/80 border border-slate-700/80 p-6 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                AI & ML Benchmark Laboratory
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {AI_METADATA.model_version}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Machine Learning Hydrological Performance
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Trained and cross-validated across {AI_METADATA.trained_events_count.toLocaleString()} real historical flood events and {AI_METADATA.monitored_basins_count} river basins from IndoFloods and CWC telemetry.
            </p>
          </div>

          {/* Key Metric Highlights */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center min-w-[100px]">
              <div className="text-2xl font-black text-cyan-400 font-mono">
                {AI_METADATA.training_accuracy}%
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Ensemble Acc
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-center min-w-[100px]">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {AI_METADATA.regression_r2}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">
                Peak Stage R²
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-4">
          {[
            { id: 'models', label: 'Model Comparisons & Metrics', icon: Layers },
            { id: 'features', label: 'Feature Importance (15 Variables)', icon: Cpu },
            { id: 'matrix', label: 'Confusion Matrix & Diagnostics', icon: Target },
            { id: 'datasets', label: 'Training Datasets & Lineage', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/70 border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Model Comparisons Table */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* Classification Models Benchmark Card */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  Multi-Class Severity Classification Benchmarks
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Predicting Severity Tiers (Critical / Moderate / Low) on holdout test set (887 events)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-4">Model Architecture</th>
                    <th className="py-3 px-4">Accuracy</th>
                    <th className="py-3 px-4">Weighted F1</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">ROC-AUC</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(CLASSIFICATION_BENCHMARKS).map(([modelName, metrics]) => {
                    const isTop = modelName.includes('Stacking') || modelName.includes('Random Forest');
                    return (
                      <tr 
                        key={modelName}
                        className={`transition hover:bg-slate-800/40 ${isTop ? 'bg-cyan-950/20' : ''}`}
                      >
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isTop ? 'bg-cyan-400' : 'bg-slate-500'}`} />
                          {modelName}
                          {isTop && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-extrabold border border-cyan-500/30">
                              TOP
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                          {metrics.accuracy}%
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-200">
                          {(metrics.f1_score / 100).toFixed(4)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {metrics.precision}%
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {metrics.recall}%
                        </td>
                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                          {metrics.roc_auc}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Validated
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Continuous Stage Regression Benchmarks Card */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Peak River Water Level (m) Regression Benchmarks
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Evaluating continuous river crest stage estimation accuracy
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-3 px-4">Regression Engine</th>
                    <th className="py-3 px-4">R² Score</th>
                    <th className="py-3 px-4">MAE (Mean Absolute Error)</th>
                    <th className="py-3 px-4">RMSE (Root Mean Squared Error)</th>
                    <th className="py-3 px-4">Error Tolerance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(REGRESSION_BENCHMARKS).map(([regName, metrics]) => (
                    <tr key={regName} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {regName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {metrics.r2_score}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-300 font-bold">
                        {metrics.mae_meters} meters
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {metrics.rmse_meters} meters
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold">
                          Sub-2m Variance
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Feature Importance Leaderboard */}
      {activeTab === 'features' && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Global Hydrological Feature Importances (Tree & Gradient Ensembles)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Relative influence of meteorological & catchment parameters on flood inundation decisions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURE_IMPORTANCES.map((item, idx) => (
              <div 
                key={item.feature}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 font-mono">
                      #{idx + 1}
                    </span>
                    <h4 className="font-bold text-sm text-white">{item.feature}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-cyan-300 font-mono">
                      {item.importance}%
                    </span>
                  </div>
                </div>

                <div className="mt-3 w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500"
                    style={{ width: `${Math.min(100, item.importance * 7)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Confusion Matrix Diagnostics */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Classification Confusion Matrix & Holdout Diagnostics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select model architecture to inspect ground-truth vs predicted contingency matrix
                </p>
              </div>

              {/* Model Picker */}
              <select
                value={selectedClfModel}
                onChange={(e) => setSelectedClfModel(e.target.value)}
                className="bg-slate-800 text-xs text-white border border-slate-700 rounded-xl px-3 py-1.5 focus:border-cyan-400 focus:outline-none"
              >
                {Object.keys(CLASSIFICATION_BENCHMARKS).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Matrix Display */}
            <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 max-w-xl mx-auto">
              <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Predicted Class →
              </div>

              {(() => {
                const classes = clfData.classes || ['Critical', 'Moderate'];
                const classColors = { 'Critical': 'text-red-400', 'Moderate': 'text-orange-400', 'Low': 'text-amber-300' };
                const numCls = classes.length;
                return (
                  <div className={`grid gap-3 text-center`} style={{ gridTemplateColumns: `repeat(${numCls}, 1fr)` }}>
                    {/* Headers */}
                    {classes.map((cls) => (
                      <div key={cls} className={`text-[11px] font-extrabold ${classColors[cls] || 'text-slate-300'}`}>{cls}</div>
                    ))}

                    {/* Matrix Rows */}
                    {clfData.confusion_matrix.map((row, rIdx) => (
                      <React.Fragment key={rIdx}>
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          return (
                            <div
                              key={cIdx}
                              className={`p-4 rounded-xl border flex flex-col items-center justify-center ${
                                isDiagonal
                                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="text-xl font-black font-mono text-white">
                                {val}
                              </span>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                {isDiagonal ? 'True Match' : 'Mismatch'}
                              </span>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}

              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Holdout Test Accuracy: <strong className="text-white">{clfData.accuracy}%</strong></span>
                <span>Weighted F1 Score: <strong className="text-white">{(clfData.f1_score / 100).toFixed(3)}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Datasets & Lineage */}
      {activeTab === 'datasets' && (
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Machine Learning Training Data Sources & Ingestion Lineage
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-source hydro-meteorological data fusion supporting RiverMind's AI models
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
                Primary Event Corpus
              </div>
              <h4 className="text-sm font-bold text-white">IndoFloods Benchmark</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Contains 4,548 documented river flood events across India with precise start/end timestamps, peak stage, discharge Q, flood volume, and duration.
              </p>
              <div className="mt-4 text-[11px] font-mono text-slate-300">
                • 4,548 Historical Records<br />
                • T1d - T10d Precipitation Profiling
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
                Catchment Geomorphology
              </div>
              <h4 className="text-sm font-bold text-white">Hydro-Morphometric Attributes</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Detailed catchment relief, stream hierarchy order (Strahler 1-8), sinuosity index, drainage area, and drainage density for 155 major river basins.
              </p>
              <div className="mt-4 text-[11px] font-mono text-slate-300">
                • 155 River Basins<br />
                • 108 Morphometric Features
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                Modern Validation
              </div>
              <h4 className="text-sm font-bold text-white">CWC 2021-2025 Telemetry</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Central Water Commission recent monitoring stations, water levels, river velocity, and flood danger thresholds for real-time validation.
              </p>
              <div className="mt-4 text-[11px] font-mono text-slate-300">
                • 214 Active Monitoring Gauges<br />
                • 22 States & Union Territories
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
