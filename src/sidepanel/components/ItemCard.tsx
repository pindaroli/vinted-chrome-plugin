import React from 'react';
import { VintedItemData } from '../../types';
import {
  ShoppingBag,
  RotateCw,
  Tag,
  Ruler,
  CheckCircle2,
  ExternalLink,
  Images,
  Database
} from 'lucide-react';

interface ItemCardProps {
  item: VintedItemData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isLoading,
  error,
  onRefresh,
}) => {
  if (isLoading && !item) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
        <RotateCw className="w-5 h-5 text-sky-400 animate-spin" />
        <p className="text-xs text-slate-300">Rilevamento annuncio Vinted in corso...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-slate-200">Nessun articolo rilevato</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-[240px]">
            {error || 'Apri un annuncio su Vinted (es. vinted.it/items/...) per analizzarlo.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Ricarica scheda
        </button>
      </div>
    );
  }

  const primaryImage = item.imageUrls?.[0];
  const photoCount = item.imageUrls?.length || 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-3">
        <div className="flex gap-3">
          {/* Immagine articolo */}
          <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600">
                <Images className="w-6 h-6" />
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-[9px] font-mono font-medium px-1.5 py-0.5 rounded text-white flex items-center gap-0.5">
              <Images className="w-2.5 h-2.5" />
              {photoCount}
            </div>
          </div>

          {/* Dettagli principali */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-1">
                <h2 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug" title={item.title}>
                  {item.title}
                </h2>
                <button
                  type="button"
                  onClick={onRefresh}
                  className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 shrink-0 transition"
                  title="Rileva di nuovo"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
                </button>
              </div>

              <div className="text-sm font-bold text-sky-400 mt-1">
                {item.price} {item.currency}
              </div>
            </div>

            {/* Badges attributi */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60">
                <Tag className="w-2.5 h-2.5 text-sky-400" />
                {item.brand}
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60">
                <Ruler className="w-2.5 h-2.5 text-emerald-400" />
                {item.size}
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60 truncate max-w-[120px]" title={item.condition}>
                <CheckCircle2 className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span className="truncate">{item.condition}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Thumbnail gallery rapida */}
        {photoCount > 1 && (
          <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-slate-800/80 overflow-x-auto pb-0.5">
            {item.imageUrls.slice(0, 7).map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Foto ${idx + 1}`}
                className="w-9 h-9 rounded object-cover border border-slate-800 shrink-0 bg-slate-950 hover:opacity-100 transition"
              />
            ))}
            {photoCount > 7 && (
              <div className="w-9 h-9 rounded bg-slate-800/80 border border-slate-700 flex items-center justify-center text-[10px] text-slate-400 font-medium shrink-0">
                +{photoCount - 7}
              </div>
            )}
          </div>
        )}

        {/* Info footer */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/50">
          <span className="inline-flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-500" />
            Fonte: {item.extractionSource}
          </span>

          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-sky-400 hover:text-sky-300 transition"
            >
              Apri su Vinted
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
