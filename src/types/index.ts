/**
 * Tipi di dominio e configurazione per Vinted AI Lens
 * Basati su Zod per validazione a runtime e type inference.
 */

export * from '../schemas/provider.schema';
export * from '../schemas/item.schema';
export * from '../schemas/analysis.schema';

import { VintedItemData, ImageData } from '../schemas/item.schema';
import { AnalysisRequest, AnalysisResult, AnalysisPresetId } from '../schemas/analysis.schema';

/** Definizione di un preset di analisi */
export interface AnalysisPreset {
  id: AnalysisPresetId;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
}

/** Messaggi interni di Chrome Runtime */
export type RuntimeMessage =
  | { type: 'GET_ITEM_DATA' }
  | { type: 'ITEM_DATA_RESPONSE'; ok: boolean; data?: VintedItemData; error?: string }
  | { type: 'FETCH_IMAGES_BASE64'; urls: string[] }
  | { type: 'FETCH_IMAGES_RESPONSE'; ok: boolean; images?: ImageData[]; error?: string }
  | { type: 'ANALYZE_REQUEST'; request: AnalysisRequest }
  | { type: 'ANALYZE_PROGRESS'; step: string; message: string; percent?: number }
  | { type: 'ANALYZE_RESPONSE'; ok: boolean; result?: AnalysisResult; error?: string };
