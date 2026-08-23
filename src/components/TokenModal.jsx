import React, { useState } from 'react';
import { Key, Check, X, Shield, ExternalLink, RefreshCw } from 'lucide-react';

export default function TokenModal({ isOpen, onClose, currentToken, onSaveToken }) {
  const [tokenInput, setTokenInput] = useState(currentToken || '');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSaveToken(tokenInput.trim());
    onClose();
  };

  const handleClear = () => {
    setTokenInput('');
    onSaveToken('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Map Engine & Style Settings</h3>
            <p className="text-xs text-slate-400">Configure Mapbox Access Token & Basemap</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Mapbox Public Access Token (Optional)
            </label>
            <input
              type="text"
              placeholder="pk.eyJ1Ijo..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-slate-950 text-xs font-mono text-cyan-300 placeholder-slate-600 px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              If left blank, RiverMind automatically uses high-performance open Dark Matter raster & vector tiles. Entering your Mapbox token activates <code className="text-cyan-400">mapbox://styles/mapbox/dark-v11</code> directly.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-300">
              <span>Current Tile Engine:</span>
              <span className="font-bold text-emerald-400">
                {tokenInput.trim() ? 'Mapbox Vector (dark-v11)' : 'Dark Minimalist Tiles'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Resolution:</span>
              <span>Retina High-DPI Vector</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 gap-3">
            {currentToken && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/30 transition"
              >
                Clear Token
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Apply & Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
