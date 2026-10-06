import { AIProvider } from './provider.interface';
import { AnalysisRequest, AnalysisResult, ProviderConfig } from '../../types';
import { buildPrompt, parseAndValidateResult } from '../../prompts/presets';

/**
 * Adapter compatibile con le API standard OpenAI (/v1/chat/completions)
 * Funziona sia con OpenAI ufficiale sia con provider locali / self-hosted:
 * - Ollama (http://localhost:11434/v1) con modelli vision come qwen2.5-vl, minicpm-v, llava
 * - LM Studio (http://localhost:1234/v1)
 * - vLLM (http://localhost:8000/v1)
 * - LocalAI (http://localhost:8080/v1)
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly id = 'openai-compatible';
  readonly name: string;

  private baseUrl: string;
  private modelName: string;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.baseUrl = (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    this.modelName = config.modelName || 'gpt-4o-mini';
    this.apiKey = config.apiKey ? config.apiKey.trim() : '';

    // Nome amichevole dinamico per identificare se l'istanza è locale o cloud
    const isLocal = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
    this.name = isLocal 
      ? `OpenAI-Compatible Local (${this.modelName})`
      : `OpenAI Cloud (${this.modelName})`;
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResult> {
    const isLocal = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');

    // Su cloud OpenAI la chiave è tassativa; sui runtime locali (Ollama, LM Studio) è opzionale
    if (!isLocal && !this.apiKey) {
      throw new Error('API Key mancante per endpoint OpenAI Cloud. Inseriscila nelle impostazioni del Side Panel.');
    }

    const startTime = performance.now();
    const { systemInstruction, userPrompt } = buildPrompt(
      request.presetId,
      request.item,
      request.customPrompt,
      request.additionalNotes
    );

    // Costruzione del messaggio utente multimodale standard OpenAI
    const userContent: Array<Record<string, unknown>> = [
      { type: 'text', text: userPrompt }
    ];

    for (const img of request.images) {
      if (img.base64) {
        userContent.push({
          type: 'image_url',
          image_url: {
            url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`
          }
        });
      }
    }

    const messages = [
      {
        role: 'system',
        content: systemInstruction
      },
      {
        role: 'user',
        content: userContent
      }
    ];

    const endpoint = `${this.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(request.config.customHeaders || {})
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else if (isLocal) {
      // Alcuni server locali richiedono comunque un header bearer non vuoto
      headers['Authorization'] = 'Bearer ollama';
    }

    const basePayload: Record<string, unknown> = {
      model: this.modelName,
      messages,
      temperature: request.config.temperature ?? 0.2
    };

    // Tenta prima con response_format json_object (supportato da OpenAI e Ollama moderni)
    let candidateText: string | null = null;
    let durationMs = 0;

    try {
      const response = await this.executeChatCompletion(endpoint, headers, {
        ...basePayload,
        response_format: { type: 'json_object' }
      });
      candidateText = response;
      durationMs = Math.round(performance.now() - startTime);
    } catch (firstAttemptError) {
      const errMsg = (firstAttemptError as Error).message || '';
      // Fallback intelligente: se il server locale non supporta response_format o fallisce la grammatica, ritenta senza
      if (errMsg.includes('response_format') || errMsg.includes('json_object') || errMsg.includes('400')) {
        console.warn('Endpoint non supporta response_format json_object, fallback a prompt libero:', errMsg);
        candidateText = await this.executeChatCompletion(endpoint, headers, basePayload);
        durationMs = Math.round(performance.now() - startTime);
      } else {
        throw firstAttemptError;
      }
    }

    if (!candidateText) {
      throw new Error('Nessuna risposta generata dal provider OpenAI-Compatible.');
    }

    return parseAndValidateResult(candidateText, {
      providerId: this.id,
      modelName: this.modelName,
      durationMs,
      imageCount: request.images.length
    });
  }

  private async executeChatCompletion(
    endpoint: string,
    headers: Record<string, string>,
    payload: Record<string, unknown>
  ): Promise<string> {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      throw new Error(
        `Impossibile connettersi all'endpoint ${endpoint}. Verifica che il server sia attivo e che l'indirizzo sia corretto. Errore: ${(networkError as Error).message}`
      );
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errorJson = await response.json();
        detail = errorJson?.error?.message || JSON.stringify(errorJson);
      } catch {
        // Nessun body JSON
      }
      throw new Error(`Errore HTTP [${response.status}] da ${endpoint}: ${detail}`);
    }

    const json = await response.json();
    const messageContent = json?.choices?.[0]?.message?.content;

    if (!messageContent || typeof messageContent !== 'string') {
      throw new Error('Il payload di risposta non contiene content nei choices.');
    }

    return messageContent;
  }
}
