import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  BarChart3, 
  Zap, 
  Cpu, 
  FlaskConical, 
  RotateCcw,
  ShieldAlert,
  Brain,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import PredictorStudio from './PredictorStudio';
import ModelBenchmarks from './ModelBenchmarks';
import ScenarioTester from './ScenarioTester';

export default function AIFloodPredictor({ onSwitchToMapMode }) {
  const [activeSubTab, setActiveSubTab] = useState('studio'); // 'studio' | 'benchmarks' | 'scenarios'
  const [targetStudioStation, setTargetStudioStation] = useState(null);

  const handleSelectStationForStudio = (station) => {
    setTargetStudioStation(station);
    setActiveSubTab('studio');
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest border border-indigo-400/30 flex items-center gap-1 shadow-lg shadow-blue-500/20">
              <Brain className="w-3.5 h-3.5" />
              AI & MACHINE LEARNING PREDICTIVE ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
              IndoFloods v3.2
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            RiverMind <span className="text-cyan-400">Flood Intelligence</span> & Inundation Predictor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Trained on 4,431+ historical catchment flood events across India. Predict peak water stage exceedance, bank inundation probabilities, lead time to crest, and actionable NDRF advisories in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchToMapMode}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <span>🗺️ Return to Hotspot Map</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'studio', label: '🔮 Interactive Prediction Studio', description: 'Simulate river stages and hydrographs' },
          { id: 'benchmarks', label: '📊 Model Benchmarks & Diagnostics', description: 'Cross-validation accuracy & R² metrics' },
          { id: 'scenarios', label: '🧪 What-If Stress Testing Lab', description: 'Batch national storm simulation' }
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 border text-left shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 via-cyan-600 to-indigo-600 text-white border-cyan-400/50 shadow-xl shadow-cyan-500/20 scale-[1.01]'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border-slate-800'
              }`}
            >
              <div className="font-extrabold">{tab.label}</div>
              <div className={`text-[10px] mt-0.5 ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
                {tab.description}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Tab View Rendering */}
      <div className="pt-2">
        {activeSubTab === 'studio' && (
          <PredictorStudio defaultStation={targetStudioStation} />
        )}

        {activeSubTab === 'benchmarks' && (
          <ModelBenchmarks />
        )}

        {activeSubTab === 'scenarios' && (
          <ScenarioTester onSelectStationForStudio={handleSelectStationForStudio} />
        )}
      </div>
    </div>
  );
}
