import { AIProvider } from './provider.interface';
import { AnalysisRequest, AnalysisResult, ProviderConfig } from '../../types';
import { buildPrompt, parseAndValidateResult } from '../../prompts/presets';

/**
 * Adapter per le API REST ufficiali di Google Gemini (es. gemini-2.5-flash)
 */
export class GeminiProvider implements AIProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini Multimodal';

  private baseUrl: string;
  private modelName: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = (config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
    this.modelName = config.modelName || 'gemini-2.5-flash';
    this.apiKey = config.apiKey ? config.apiKey.trim() : '';
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    if (!this.apiKey) {
      throw new Error('API Key di Gemini non specificata. Configurala nelle impostazioni del Side Panel.');
    }

    const startTime = performance.now();
    const { systemInstruction, userPrompt } = buildPrompt(
      request.presetId,
      request.item,
      request.customPrompt,
      request.additionalNotes
    );

    // Costruzione delle parti del messaggio: prompt testuale + array di immagini Base64 inline
    const parts: Array<Record<string, unknown>> = [
      { text: userPrompt }
    ];

    for (const img of request.images) {
      if (img.base64) {
        parts.push({
          inlineData: {
            mimeType: img.mimeType || 'image/jpeg',
            data: img.base64
          }
        });
      }
    }

    const payload = {
      contents: [
        {
          role: 'user',
          parts
        }
      ],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        temperature: request.config.temperature ?? 0.2,
        responseMimeType: 'application/json'
      }
    };

    const endpoint = `${this.baseUrl}/models/${encodeURIComponent(this.modelName)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(request.config.customHeaders || {})
        },
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      throw new Error(`Errore di rete durante la chiamata a Gemini: ${(networkError as Error).message}`);
    }

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        if (errorJson?.error?.message) {
          errorDetail = errorJson.error.message;
        }
      } catch {
        // Nessun body JSON nell'errore
      }
      throw new Error(`Chiamata a Gemini fallita [HTTP ${response.status}]: ${errorDetail}`);
    }

    const json = await response.json();
    const candidateText = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText || typeof candidateText !== 'string') {
      throw new Error('La risposta di Gemini non contiene testo generato valido.');
    }

    const durationMs = Math.round(performance.now() - startTime);

    return parseAndValidateResult(candidateText, {
      providerId: this.id,
      modelName: this.modelName,
      durationMs,
      imageCount: request.images.length
    });
  }
}
