import { AnalysisRequest, AnalysisResult } from '../../types';

/**
 * Contratto astratto per qualsiasi Provider AI multimodale (Cloud o Locale)
 */
export interface AIProvider {
  /** Identificatore univoco del provider (es. 'gemini', 'openai-compatible', 'custom-http') */
  readonly id: string;

  /** Nome human-readable per display e log (es. 'Google Gemini API', 'OpenAI / Local LLM') */
  readonly name: string;

  /**
   * Esegue l'analisi multimodale inviando testo, metadati dell'annuncio e immagini in Base64
   * @param request Oggetto completo con dati annuncio, immagini codificate e opzioni di prompt
   * @returns Risultato unificato e validato secondo lo schema AnalysisResult
   */
  analyze(request: AnalysisRequest): Promise<AnalysisResult>;
}
