import { useState, useEffect, useCallback } from 'react';
import { VintedItemData, VintedItemDataSchema } from '../../types';

export function useVintedItem() {
  const [item, setItem] = useState<VintedItemData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryActiveTab = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.id || !activeTab.url) {
        setItem(null);
        setError('Nessuna scheda attiva trovata.');
        setIsLoading(false);
        return;
      }

      if (!activeTab.url.includes('vinted.') || !activeTab.url.includes('/items/')) {
        setItem(null);
        setError('Naviga su una pagina annuncio di Vinted per avviare l\'analisi.');
        setIsLoading(false);
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { type: 'GET_ITEM_DATA' }, (response) => {
        if (chrome.runtime.lastError) {
          setError('Impossibile comunicare con la pagina. Prova a ricaricare la scheda di Vinted.');
          setItem(null);
          setIsLoading(false);
          return;
        }

        if (response && response.ok && response.data) {
          const parsed = VintedItemDataSchema.safeParse(response.data);
          if (parsed.success) {
            setItem(parsed.data);
            setError(null);
          } else {
            console.warn('[Vinted AI Lens] Errore validazione Zod item data:', parsed.error);
            setItem(response.data as VintedItemData);
          }
        } else {
          setError(response?.error || 'Dati dell\'annuncio non disponibili.');
          setItem(null);
        }
        setIsLoading(false);
      });
    } catch (err) {
      setError((err as Error).message);
      setItem(null);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queryActiveTab();

    const handleTabActivated = () => {
      queryActiveTab();
    };

    const handleTabUpdated = (_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (changeInfo.status === 'complete') {
        queryActiveTab();
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [queryActiveTab]);

  return { item, isLoading, error, refreshItem: queryActiveTab };
}
