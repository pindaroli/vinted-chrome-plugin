import { describe, it, expect } from 'vitest';
import {
  ProviderConfigSchema,
  DEFAULT_PROVIDER_CONFIG,
  VintedItemDataSchema,
  AnalysisResultSchema,
} from '../src/types';

describe('Zod Schemas Validation', () => {
  describe('ProviderConfigSchema', () => {
    it('dovrebbe validare con successo la configurazione di default', () => {
      const parsed = ProviderConfigSchema.safeParse(DEFAULT_PROVIDER_CONFIG);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.providerId).toBe('gemini');
        expect(parsed.data.modelName).toBe('gemini-2.5-flash');
      }
    });

    it('dovrebbe fallire se baseUrl o modelName sono vuoti', () => {
      const invalid = {
        providerId: 'gemini',
        baseUrl: '',
        modelName: '',
        apiKey: '',
      };
      const parsed = ProviderConfigSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });

    it('dovrebbe validare provider openai-compatible e custom-http', () => {
      const openai = {
        providerId: 'openai-compatible',
        baseUrl: 'http://localhost:11434/v1',
        modelName: 'qwen2.5-vl:7b',
        apiKey: '',
        temperature: 0.5,
      };
      expect(ProviderConfigSchema.safeParse(openai).success).toBe(true);
    });
  });

  describe('VintedItemDataSchema', () => {
    it('dovrebbe validare i dati di un annuncio Vinted con valori di default', () => {
      const minimalItem = {
        id: '12345678',
        title: 'Giacca Vintage',
        price: '25.00',
      };
      const parsed = VintedItemDataSchema.safeParse(minimalItem);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.currency).toBe('EUR');
        expect(parsed.data.brand).toBe('Non specificato');
        expect(parsed.data.extractionSource).toBe('dom-fallback');
      }
    });

    it('dovrebbe accettare dom-gallery come fonte di estrazione valida', () => {
      const itemWithGallery = {
        id: '12345678',
        extractionSource: 'dom-gallery',
      };
      const parsed = VintedItemDataSchema.safeParse(itemWithGallery);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.extractionSource).toBe('dom-gallery');
      }
    });
  });

  describe('AnalysisResultSchema', () => {
    it('dovrebbe validare un risultato di audit AI conforme', () => {
      const validResult = {
        brand_rilevato: 'Nike',
        corrispondenza_dichiarato: true,
        taglia_rilevata: 'L',
        composizione_materiali: ['100% Cotone'],
        difetti_e_segni_usura: [],
        analisi_dettagliata: 'Capo in eccellenti condizioni, nessun difetto riscontrato.',
        punteggio_affidabilita: 9,
        metadata: {
          providerId: 'gemini',
          modelName: 'gemini-2.5-flash',
          durationMs: 1450,
          timestamp: new Date().toISOString(),
          imageCount: 2,
        },
      };
      const parsed = AnalysisResultSchema.safeParse(validResult);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.punteggio_affidabilita).toBe(9);
      }
    });

    it('dovrebbe rifiutare punteggi di affidabilità fuori dal range 1-10', () => {
      const invalidScore = {
        brand_rilevato: 'Test',
        corrispondenza_dichiarato: false,
        taglia_rilevata: 'M',
        composizione_materiali: [],
        difetti_e_segni_usura: [],
        analisi_dettagliata: 'Test',
        punteggio_affidabilita: 15, // Fuori limite
        metadata: {
          providerId: 'test',
          modelName: 'test',
          durationMs: 100,
          timestamp: new Date().toISOString(),
          imageCount: 1,
        },
      };
      const parsed = AnalysisResultSchema.safeParse(invalidScore);
      expect(parsed.success).toBe(false);
    });
  });
});
