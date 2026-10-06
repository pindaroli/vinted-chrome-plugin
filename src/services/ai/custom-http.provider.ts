import { AIProvider } from './provider.interface';
import { AnalysisRequest, AnalysisResult, ProviderConfig } from '../../types';
import { buildPrompt, parseAndValidateResult } from '../../prompts/presets';

/**
 * Adapter generico per endpoint HTTP REST personalizzati (es. microservizi Python FastAPI, Flask, server webhook)
 * che accettano un payload JSON con i dati dell'annuncio e le immagini codificate in Base64.
 */
export class CustomHttpProvider implements AIProvider {
  readonly id = 'custom-http';
  readonly name = 'Custom Local REST Endpoint';

  private endpoint: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.endpoint = config.baseUrl || 'http://localhost:8000/analyze';
    this.apiKey = config.apiKey ? config.apiKey.trim() : '';
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const startTime = performance.now();
    const { systemInstruction, userPrompt } = buildPrompt(
      request.presetId,
      request.item,
      request.customPrompt,
      request.additionalNotes
    );

    const payload = {
      presetId: request.presetId,
      systemInstruction,
      prompt: userPrompt,
      item: request.item,
      images: request.images.map(img => ({
        url: img.url,
        mimeType: img.mimeType,
        base64: img.base64
      })),
      customPrompt: request.customPrompt,
      additionalNotes: request.additionalNotes
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(request.config.customHeaders || {})
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['X-API-Key'] = this.apiKey;
    }

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      throw new Error(
        `Errore di rete connettendosi all'endpoint personalizzato ${this.endpoint}: ${(networkError as Error).message}`
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Endpoint personalizzato ha risposto con errore HTTP ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const durationMs = Math.round(performance.now() - startTime);
    const responseJson = await response.json();

    // Se l'endpoint restituisce direttamente i campi dell'AnalysisResult in JSON
    if (responseJson && typeof responseJson === 'object' && 'brand_rilevato' in responseJson) {
      return parseAndValidateResult(JSON.stringify(responseJson), {
        providerId: this.id,
        modelName: 'custom-endpoint',
        durationMs,
        imageCount: request.images.length
      });
    }

    // Se l'endpoint restituisce un campo testo/output da parsare
    const textOutput = responseJson.output || responseJson.text || responseJson.response || JSON.stringify(responseJson);
    return parseAndValidateResult(String(textOutput), {
      providerId: this.id,
      modelName: 'custom-endpoint',
      durationMs,
      imageCount: request.images.length
    });
  }
}
