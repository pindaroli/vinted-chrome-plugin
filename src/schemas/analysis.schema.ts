import { z } from 'zod';
import { VintedItemDataSchema, ImageDataSchema } from './item.schema';
import { ProviderConfigSchema } from './provider.schema';

export const AnalysisPresetIdSchema = z.enum([
  'full-audit',
  'authenticity',
  'composition',
  'defects',
  'custom',
]);
export type AnalysisPresetId = z.infer<typeof AnalysisPresetIdSchema>;

export const AnalysisMetadataSchema = z.object({
  providerId: z.string(),
  modelName: z.string(),
  durationMs: z.number(),
  timestamp: z.string().default(() => new Date().toISOString()),
  imageCount: z.number().default(0),
});
export type AnalysisMetadata = z.infer<typeof AnalysisMetadataSchema>;

/** Schema dell'output AI strutturato */
export const AnalysisResultSchema = z.object({
  brand_rilevato: z.string().default('Non identificabile'),
  corrispondenza_dichiarato: z.boolean().default(false),
  taglia_rilevata: z.string().default('Non visibile'),
  composizione_materiali: z.array(z.string()).default([]),
  difetti_e_segni_usura: z.array(z.string()).default([]),
  codici_o_seriali: z.string().optional(),
  analisi_dettagliata: z.string().default('Analisi completata.'),
  punteggio_affidabilita: z.number().min(1).max(10).default(7),
  rawResponse: z.string().optional(),
  metadata: AnalysisMetadataSchema,
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export const AnalysisRequestSchema = z.object({
  item: VintedItemDataSchema,
  images: z.array(ImageDataSchema).default([]),
  presetId: AnalysisPresetIdSchema,
  customPrompt: z.string().optional(),
  additionalNotes: z.string().optional(),
  config: ProviderConfigSchema,
});
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
