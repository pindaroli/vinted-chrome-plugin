import { useState, useEffect, useCallback } from 'react';
import { ProviderConfig, ProviderConfigSchema, DEFAULT_PROVIDER_CONFIG } from '../../types';

export function useProviderConfig() {
  const [config, setConfig] = useState<ProviderConfig>(DEFAULT_PROVIDER_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(['providerConfig'], (result) => {
      if (result.providerConfig) {
        const parsed = ProviderConfigSchema.safeParse(result.providerConfig);
        if (parsed.success) {
          setConfig(parsed.data);
        } else {
          console.warn('[Vinted AI Lens] Configurazione storage non valida, fallback ai default:', parsed.error);
          setConfig(DEFAULT_PROVIDER_CONFIG);
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const saveConfig = useCallback(async (newConfig: ProviderConfig) => {
    const validated = ProviderConfigSchema.parse(newConfig);
    await chrome.storage.local.set({ providerConfig: validated });
    setConfig(validated);
  }, []);

  return { config, saveConfig, isLoaded };
}
