import { z } from 'zod';

export const ExtractionSourceSchema = z.enum(['next-data', 'vinted-state', 'json-ld', 'dom-gallery', 'dom-fallback']);
export type ExtractionSource = z.infer<typeof ExtractionSourceSchema>;

export const ImageDataSchema = z.object({
  url: z.string(),
  base64: z.string(),
  mimeType: z.string().default('image/jpeg'),
});
export type ImageData = z.infer<typeof ImageDataSchema>;

export const VintedItemDataSchema = z.object({
  id: z.string(),
  title: z.string().default(''),
  description: z.string().default(''),
  price: z.string().default('0'),
  currency: z.string().default('EUR'),
  brand: z.string().default('Non specificato'),
  size: z.string().default('Non specificata'),
  condition: z.string().default('Non specificata'),
  color: z.string().optional(),
  location: z.string().optional(),
  details: z.record(z.string(), z.string()).default({}),
  imageUrls: z.array(z.string()).default([]),
  url: z.string().default(''),
  extractedAt: z.string().default(() => new Date().toISOString()),
  extractionSource: ExtractionSourceSchema.default('dom-fallback'),
});

export type VintedItemData = z.infer<typeof VintedItemDataSchema>;
