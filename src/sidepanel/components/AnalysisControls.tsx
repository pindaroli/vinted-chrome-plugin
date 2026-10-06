import React from 'react';
import { AnalysisPresetId } from '../../types';
import {
  FileCheck2,
  ShieldCheck,
  Layers,
  AlertTriangle,
  SlidersHorizontal,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface AnalysisControlsProps {
  presetId: AnalysisPresetId;
  setPresetId: (preset: AnalysisPresetId) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  additionalNotes: string;
  setAdditionalNotes: (notes: string) => void;
  onStartAnalysis: () => void;
  isAnalyzing: boolean;
  disabled: boolean;
}

const PRESETS = [
  {
    id: 'full-audit' as const,
    title: 'Audit Completo',
    subtitle: 'Brand, etichette, taglia, materiali e difetti',
    icon: FileCheck2,
    badge: 'Consigliato',
  },
  {
    id: 'authenticity' as const,
    title: 'Autenticità & Seriali',
    subtitle: 'Loghi, font, cuciture, codici seriali e RN',
    icon: ShieldCheck,
  },
  {
    id: 'composition' as const,
    title: 'Tessuti & Cura',
    subtitle: 'Percentuali fibre tessili e simboli lavaggio',
    icon: Layers,
  },
  {
    id: 'defects' as const,
    title: 'Rilevamento Difetti',
    subtitle: 'Macchie, pilling, fori, usura colletti/orli',
    icon: AlertTriangle,
  },
  {
    id: 'custom' as const,
    title: 'Prompt Personalizzato',
    subtitle: 'Definisci istruzioni specifiche ad-hoc',
    icon: SlidersHorizontal,
  },
];

export const AnalysisControls: React.FC<AnalysisControlsProps> = ({
  presetId,
  setPresetId,
  customPrompt,
  setCustomPrompt,
  additionalNotes,
  setAdditionalNotes,
  onStartAnalysis,
  isAnalyzing,
  disabled,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
      <div>
        <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
          Modalità di Analisi AI
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const isSelected = presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(p.id)}
                className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition border ${
                  isSelected
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-xs'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div
                  className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
                    isSelected ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold leading-tight">{p.title}</span>
                    {p.badge && (
                      <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-snug mt-0.5">{p.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Se preset Custom: textarea istruzioni */}
      {presetId === 'custom' && (
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider block">
            Istruzioni Custom per l'AI
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            placeholder="es. Verifica se le scarpe hanno la suola originale e se la scatola è coerente..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-hidden rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 resize-none transition"
          />
        </div>
      )}

      {/* Note aggiuntive facoltative */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-slate-500" />
          Note aggiuntive per l'analisi (opzionale)
        </label>
        <input
          type="text"
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="es. Controlla in particolare la zip della tasca interna..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 focus:outline-hidden rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 transition"
        />
      </div>

      {/* Pulsante Avvia Analisi */}
      <button
        type="button"
        onClick={onStartAnalysis}
        disabled={disabled || isAnalyzing}
        className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md ${
          disabled || isAnalyzing
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
            : 'bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-white shadow-sky-500/25 active:scale-[0.99]'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        {isAnalyzing ? 'Analisi in corso...' : 'Avvia Verifica Multimodale AI'}
      </button>
    </div>
  );
};
