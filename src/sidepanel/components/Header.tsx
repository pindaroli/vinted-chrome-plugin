import React from 'react';
import { Sparkles, ScanSearch, Settings2, Cpu } from 'lucide-react';
import { ProviderConfig } from '../../types';
import { APP_VERSION } from '../../version';

interface HeaderProps {
  activeTab: 'analysis' | 'settings';
  setActiveTab: (tab: 'analysis' | 'settings') => void;
  config: ProviderConfig;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, config }) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-sky-500/20">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Vinted AI Lens</span>
              <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700/60 shadow-inner">
                v{APP_VERSION}
              </span>
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                PRO
              </span>
            </h1>
          </div>
        </div>

        {/* Badge Provider & Model */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 max-w-[170px]">
          <Cpu className="w-3 h-3 text-sky-400 shrink-0" />
          <div className="truncate text-[10px]">
            <span className="font-semibold text-slate-200 uppercase">{config.providerId}</span>
            <span className="text-slate-400 mx-1">·</span>
            <span className="text-slate-300 font-mono" title={config.modelName}>
              {config.modelName}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-0.5 bg-slate-950/70 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
            activeTab === 'analysis'
              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ScanSearch className="w-3.5 h-3.5" />
          <span>Analisi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Impostazioni</span>
        </button>
      </div>
    </header>
  );
};
