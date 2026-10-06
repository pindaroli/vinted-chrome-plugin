import { useState, useEffect, useCallback, useRef } from 'react';
import { ProviderType } from '../../types';

export function useModelList(
  providerId: ProviderType,
  baseUrl: string,
  apiKey: string,
  selectedModel: string,
  onSelectModel?: (model: string) => void
) {
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqSeq = useRef(0);

  const fetchModels = useCallback(async () => {
    if (providerId === 'custom-http') {
      setModels([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const currentSeq = ++reqSeq.current;
    setIsLoading(true);
    setError(null);

    const base = baseUrl.replace(/\/+$/, '');

    try {
      let list: string[] = [];

      if (providerId === 'gemini') {
        if (!apiKey.trim()) {
          throw new Error('API Key obbligatoria per recuperare i modelli Gemini');
        }
        const endpoint = `${base}/models?pageSize=1000&key=${encodeURIComponent(apiKey.trim())}`;
        const res = await fetch(endpoint);
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const errJson = await res.json();
            if (errJson?.error?.message) msg += `: ${errJson.error.message}`;
          } catch {}
          throw new Error(msg);
        }
        const json = await res.json();
        const allModels = (json.models || []) as Array<{ name: string; supportedGenerationMethods?: string[] }>;
        const filtered = allModels
          .filter(m => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));
        list = (filtered.length > 0 ? filtered : allModels.map(m => m.name.replace(/^models\//, ''))).sort();
      } else {
        // OpenAI-compatible (OpenAI, Ollama, LM Studio)
        const headers: Record<string, string> = {};
        if (apiKey.trim()) {
          headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        }
        let res = await fetch(`${base}/models`, { headers });
        if (!res.ok && !base.endsWith('/v1')) {
          const fallbackRes = await fetch(`${base}/v1/models`, { headers }).catch(() => null);
          if (fallbackRes && fallbackRes.ok) {
            res = fallbackRes;
          }
        }
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const errJson = await res.json();
            if (errJson?.error?.message) msg += `: ${errJson.error.message}`;
          } catch {}
          throw new Error(msg);
        }
        const json = await res.json();
        const rawList = (json.data || json.models || []) as Array<{ id?: string; name?: string }>;
        list = rawList.map(m => m.id || m.name || '').filter(Boolean).sort();
      }

      if (currentSeq !== reqSeq.current) return;

      if (list.length === 0) {
        throw new Error('Nessun modello disponibile trovato su questo endpoint');
      }

      setModels(list);
      setError(null);

      // Seleziona il modello migliore se quello corrente non è nella lista
      if (onSelectModel) {
        if (list.includes(selectedModel)) {
          // Mantieni
        } else if (selectedModel && list.some(m => m.toLowerCase().includes(selectedModel.toLowerCase()))) {
          const match = list.find(m => m.toLowerCase().includes(selectedModel.toLowerCase()));
          if (match) onSelectModel(match);
        } else if (list.includes('gemini-2.5-flash')) {
          onSelectModel('gemini-2.5-flash');
        } else if (list.includes('gemini-2.0-flash')) {
          onSelectModel('gemini-2.0-flash');
        } else if (list.includes('gemini-1.5-flash')) {
          onSelectModel('gemini-1.5-flash');
        } else if (list.includes('gpt-4o-mini')) {
          onSelectModel('gpt-4o-mini');
        } else {
          onSelectModel(list[0]);
        }
      }
    } catch (err) {
      if (currentSeq !== reqSeq.current) return;
      setError((err as Error).message);
      // Mantieni almeno il modello selezionato corrente se presente
      if (selectedModel && !models.includes(selectedModel)) {
        setModels([selectedModel]);
      }
    } finally {
      if (currentSeq === reqSeq.current) {
        setIsLoading(false);
      }
    }
  }, [providerId, baseUrl, apiKey, selectedModel, onSelectModel, models]);

  // Caricamento iniziale e al cambio di provider o endpoint
  useEffect(() => {
    if (providerId === 'custom-http') return;

    const timer = setTimeout(() => {
      fetchModels();
    }, 500);

    return () => clearTimeout(timer);
  }, [providerId, baseUrl, apiKey]);

  return { models, isLoading, error, refreshModels: fetchModels };
}
