import { describe, it, expect } from 'vitest';
import { buildPrompt, parseAndValidateResult } from '../src/prompts/presets';
import { VintedItemData } from '../src/types';

describe('Prompts & AI Output Parser', () => {
  const dummyItem: VintedItemData = {
    id: '998877',
    title: 'Ventilateur de refroidissement pour PC',
    description: 'Ventola Noctua 120mm funzionante',
    price: '8.99',
    currency: 'EUR',
    brand: 'Noctua',
    size: 'Non specificata',
    condition: 'Ottime',
    details: { Colore: 'Marrone' },
    imageUrls: ['https://images1.vinted.net/f800/1.jpg', 'https://images1.vinted.net/f800/2.jpg'],
    url: 'https://www.vinted.fr/items/998877-ventilateur',
    extractedAt: new Date().toISOString(),
    extractionSource: 'dom-fallback',
  };

  it('dovrebbe costruire il prompt includendo i dati essenziali dell\'annuncio', () => {
    const { systemInstruction, userPrompt } = buildPrompt('full-audit', dummyItem);

    expect(systemInstruction).toContain('perito');
    expect(userPrompt).toContain('Ventilateur de refroidissement pour PC');
    expect(userPrompt).toContain('Noctua');
    expect(userPrompt).toContain('8.99 EUR');
  });

  it('dovrebbe parsare ed estrarre un JSON valido all\'interno di blocchi markdown', () => {
    const mockAiResponse = `
Ecco l'esito dell'analisi:
\`\`\`json
{
  "brand_rilevato": "Noctua",
  "corrispondenza_dichiarato": true,
  "taglia_rilevata": "120mm",
  "composizione_materiali": ["Plastica rinforzata", "Metallo"],
  "difetti_e_segni_usura": ["Lieve polvere sulle pale"],
  "analisi_dettagliata": "La ventola appare originale e in perfetto stato.",
  "punteggio_affidabilita": 9
}
\`\`\`
Spero sia utile!
`;

    const result = parseAndValidateResult(mockAiResponse, {
      providerId: 'gemini',
      modelName: 'gemini-2.5-flash',
      durationMs: 950,
      imageCount: 2,
    });

    expect(result.brand_rilevato).toBe('Noctua');
    expect(result.corrispondenza_dichiarato).toBe(true);
    expect(result.punteggio_affidabilita).toBe(9);
    expect(result.difetti_e_segni_usura).toHaveLength(1);
    expect(result.metadata.modelName).toBe('gemini-2.5-flash');
  });

  it('dovrebbe lanciare errore se la risposta non contiene un JSON estraibile', () => {
    const invalidText = 'Mi dispiace, non riesco ad analizzare questa immagine.';

    expect(() => {
      parseAndValidateResult(invalidText, {
        providerId: 'gemini',
        modelName: 'gemini-2.5-flash',
        durationMs: 500,
        imageCount: 1,
      });
    }).toThrow(/Impossibile parsare/);
  });
});
