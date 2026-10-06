import { z } from 'zod';

export const ProviderTypeSchema = z.enum(['gemini', 'openai-compatible', 'custom-http']);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ProviderConfigSchema = z.object({
  providerId: ProviderTypeSchema,
  baseUrl: z.string().min(1, 'Base URL obbligatorio'),
  modelName: z.string().min(1, 'Nome modello obbligatorio'),
  apiKey: z.string().default(''),
  customHeaders: z.record(z.string(), z.string()).optional(),
  temperature: z.number().min(0).max(1).default(0.2),
  maxOutputTokens: z.number().positive().optional(),
});

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  providerId: 'gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  modelName: 'gemini-2.5-flash',
  apiKey: '',
  temperature: 0.2,
};
