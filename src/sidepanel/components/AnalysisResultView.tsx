import React, { useState } from 'react';
import { AnalysisResult, VintedItemData } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Tag,
  Ruler,
  Layers,
  AlertTriangle,
  Barcode,
  Copy,
  Check,
  RotateCcw,
  Clock,
  Sparkles
} from 'lucide-react';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  item: VintedItemData;
  onReset: () => void;
}

export const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({
  result,
  item,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const score = result.punteggio_affidabilita;

  let scoreColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  let scoreBadge = 'Alta Affidabilità';
  let ScoreIcon = ShieldCheck;

  if (score <= 4) {
    scoreColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    scoreBadge = 'Rischio Elevato';
    ScoreIcon = AlertOctagon;
  } else if (score <= 7) {
    scoreColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    scoreBadge = 'Attenzione Richiesta';
    ScoreIcon = ShieldAlert;
  }

  const handleCopyReport = () => {
    const reportText = `=== AUDIT VINTED AI LENS ===
Articolo: ${item.title}
Prezzo: ${item.price} ${item.currency}
Link: ${item.url}

PUNTEGGIO DI AFFIDABILITÀ: ${result.punteggio_affidabilita}/10 (${scoreBadge})
- Brand rilevato: ${result.brand_rilevato} (${result.corrispondenza_dichiarato ? 'Corrisponde' : 'NON Corrisponde'})
- Taglia letta: ${result.taglia_rilevata}
- Composizione: ${result.composizione_materiali.length ? result.composizione_materiali.join(', ') : 'Non visibile su etichetta'}
- Difetti / Usura: ${result.difetti_e_segni_usura.length ? result.difetti_e_segni_usura.join('; ') : 'Nessun difetto rilevato'}
${result.codici_o_seriali ? `- Seriali/Codici: ${result.codici_o_seriali}` : ''}

VALUTAZIONE DETTAGLIATA:
${result.analisi_dettagliata}

Analizzato con ${result.metadata.providerId} (${result.metadata.modelName}) in ${result.metadata.durationMs}ms`.trim();

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      {/* Scheda Score Principale */}
      <div className={`p-3.5 rounded-xl border ${scoreColor} shadow-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-black/20">
              <ScoreIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                Punteggio Affidabilità
              </div>
              <div className="text-sm font-bold flex items-baseline gap-1">
                <span className="text-xl">{score}</span>
                <span className="text-xs opacity-70">/ 10</span>
                <span className="text-xs font-medium ml-1.5 opacity-90">({scoreBadge})</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 transition text-slate-200"
            title="Nuova analisi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Griglia Rilevamenti Chiave */}
      <div className="grid grid-cols-2 gap-2">
        {/* Brand */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Tag className="w-3 h-3 text-sky-400" />
              Brand Rilevato
            </span>
            {result.corrispondenza_dichiarato ? (
              <span className="text-emerald-400 flex items-center gap-0.5 text-[9px] font-bold">
                <CheckCircle2 className="w-2.5 h-2.5" /> OK
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-0.5 text-[9px] font-bold">
                <XCircle className="w-2.5 h-2.5" /> Difforme
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-100 truncate" title={result.brand_rilevato}>
            {result.brand_rilevato}
          </div>
        </div>

        {/* Taglia */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-medium">
              <Ruler className="w-3 h-3 text-emerald-400" />
              Taglia Letta
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-100 truncate" title={result.taglia_rilevata}>
            {result.taglia_rilevata}
          </div>
        </div>
      </div>

      {/* Composizione Materiali */}
      {result.composizione_materiali.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-teal-400" />
            Composizione Tessile Rilevata
          </div>
          <div className="flex flex-wrap gap-1">
            {result.composizione_materiali.map((mat, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-medium"
              >
                {mat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Difetti e Usura */}
      {result.difetti_e_segni_usura.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
          <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Difetti e Segni di Usura Rilevati ({result.difetti_e_segni_usura.length})
          </div>
          <ul className="space-y-1">
            {result.difetti_e_segni_usura.map((defect, i) => (
              <li
                key={i}
                className="text-[11px] text-slate-300 flex items-start gap-1.5 bg-slate-950/60 p-1.5 rounded-lg border border-slate-800"
              >
                <span className="text-amber-400 font-bold leading-none mt-0.5">•</span>
                <span className="leading-tight">{defect}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex items-center gap-2 text-emerald-400 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Nessun difetto evidente o segno d'usura rilevato nelle fotografie.</span>
        </div>
      )}

      {/* Codici e Seriali */}
      {result.codici_o_seriali && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Barcode className="w-3 h-3 text-sky-400" />
            Codici Seriali / RN Rilevati
          </div>
          <div className="font-mono text-[11px] text-sky-300 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            {result.codici_o_seriali}
          </div>
        </div>
      )}

      {/* Analisi Discorsiva Approfondita */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1.5">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Valutazione Peritale Completa
        </div>
        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
          {result.analisi_dettagliata}
        </p>
      </div>

      {/* Tasto Copia Report */}
      <button
        type="button"
        onClick={handleCopyReport}
        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
          copied
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            Report Copiato negli Appunti!
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            Copia Report di Analisi
          </>
        )}
      </button>

      {/* Metadata footer */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Tempo: {result.metadata.durationMs}ms
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-sky-400" />
          {result.metadata.providerId} ({result.metadata.modelName})
        </span>
      </div>
    </div>
  );
};
