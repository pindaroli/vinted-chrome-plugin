import { AIProvider } from './provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAICompatibleProvider } from './openai-compatible.provider';
import { CustomHttpProvider } from './custom-http.provider';
import { ProviderConfig } from '../../types';

/**
 * Factory per istanziare dinamicamente il provider AI corretto in base alla configurazione utente
 */
export class AIProviderFactory {
  /**
   * Crea un'istanza del provider AI richiesta
   * @param config Configurazione memorizzata con providerId, baseUrl, modelName e apiKey
   */
  static create(config: ProviderConfig): AIProvider {
    switch (config.providerId) {
      case 'gemini':
        return new GeminiProvider(config);

      case 'openai-compatible':
        return new OpenAICompatibleProvider(config);

      case 'custom-http':
        return new CustomHttpProvider(config);

      default:
        console.warn(`Provider sconosciuto "${config.providerId}", fallback su Gemini`);
        return new GeminiProvider(config);
    }
  }

  /**
   * Restituisce i template di configurazione predefiniti per agevolare l'utente
   */
  static getDefaultConfigs(): Record<string, Partial<ProviderConfig>> {
    return {
      gemini: {
        providerId: 'gemini',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        modelName: 'gemini-2.5-flash',
        apiKey: '',
        temperature: 0.2
      },
      openai: {
        providerId: 'openai-compatible',
        baseUrl: 'https://api.openai.com/v1',
        modelName: 'gpt-4o-mini',
        apiKey: '',
        temperature: 0.2
      },
      ollama: {
        providerId: 'openai-compatible',
        baseUrl: 'http://localhost:11434/v1',
        modelName: 'qwen2.5-vl:7b',
        apiKey: '',
        temperature: 0.2
      },
      lmstudio: {
        providerId: 'openai-compatible',
        baseUrl: 'http://localhost:1234/v1',
        modelName: 'qwen2.5-vl',
        apiKey: '',
        temperature: 0.2
      },
      custom: {
        providerId: 'custom-http',
        baseUrl: 'http://localhost:8000/analyze',
        modelName: 'custom-model',
        apiKey: '',
        temperature: 0.2
      }
    };
  }
}
