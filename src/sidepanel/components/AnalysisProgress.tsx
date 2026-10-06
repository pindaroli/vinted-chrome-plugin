import React, { useState, useEffect } from 'react';
import { Loader2, Bot, Sparkles, Clock } from 'lucide-react';
import { ProviderConfig } from '../../types';

interface AnalysisProgressProps {
  stepMessage: string;
  config: ProviderConfig;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ stepMessage, config }) => {
  const [elapsed, setElapsed] = useState(0);

  // Timer per mostrare da quanto tempo è in corso l'elaborazione
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatta i secondi in MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-4 shadow-lg shadow-sky-500/10 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shrink-0">
          <Bot className="w-5 h-5 animate-pulse" />
          <div className="absolute -top-1 -right-1">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
            <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            <span>Elaborazione Multimodale</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{stepMessage}</p>
        </div>
      </div>

      {/* Barra di caricamento indeterminata ad animazione continua */}
      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-sky-500 via-teal-400 to-sky-500 w-full animate-pulse"></div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-sky-400" />
          Modello: <strong className="text-slate-400 font-mono">{config.modelName}</strong>
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-mono text-sky-400/80">
            <Clock className="w-3 h-3" />
            {formatTime(elapsed)}
          </span>
          <span className="uppercase tracking-wider">{config.providerId}</span>
        </div>
      </div>
    </div>
  );
};
