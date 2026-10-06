import { ImageData, RuntimeMessage } from './types';
import { AIProviderFactory } from './services/ai/factory';

/**
 * Background Service Worker per Vinted AI Lens
 * 
 * Compiti:
 * 1. Download sicuro dei binari immagini da CDN Vinted e conversione Base64 in memoria
 *    (Bypassa hotlinking e CORS grazie alle host_permissions in Manifest V3).
 * 2. Caching in memoria dei Base64 per evitare richieste ripetute.
 * 3. Apertura del Side Panel al click sull'icona dell'estensione.
 * 4. Orchestrazione ed esecuzione delle chiamate AI tramite AIProviderFactory.
 */

// Cache in memoria per le immagini già convertite in Base64 (URL -> ImageData)
const imageMemoryCache = new Map<string, ImageData>();

// Abilita l'apertura del Side Panel al click sull'azione dell'estensione
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Vinted AI Lens] Estensione installata.');
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.warn('[Vinted AI Lens] Errore configurazione SidePanel behavior:', err));
  }
});

/**
 * Converte un ArrayBuffer in stringa Base64 in modo sicuro ed efficiente per service worker
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32KB chunks per prevenire stack overflow su immagini grandi

  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/**
 * Scarica un'immagine via fetch nel contesto privilegiato del service worker e la transcodifica forzatamente in JPEG
 * tramite OffscreenCanvas. Questo garantisce la massima compatibilità con modelli locali (Ollama, LM Studio)
 * che spesso non supportano formati iper-compressi come AVIF o WebP forniti dalla CDN di Vinted.
 */
async function fetchAndEncodeImage(url: string): Promise<ImageData> {
  if (imageMemoryCache.has(url)) {
    return imageMemoryCache.get(url)!;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // Limitiamo i formati richiesti scoraggiando AVIF
        'Accept': 'image/jpeg,image/png,image/webp,*/*;q=0.8',
        'Referer': 'https://www.vinted.it/'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} durante il fetch dell'immagine ${url}`);
    }

    const blob = await response.blob();
    
    // Decodifica nativa del browser (supporta WebP, AVIF, ecc.)
    const bitmap = await createImageBitmap(blob);
    
    // Rasterizzazione su OffscreenCanvas
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("OffscreenCanvas 2D non supportato dal browser");
    
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close(); // Libera la memoria del bitmap

    // Esportazione forzata in JPEG (qualità 90%)
    const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
    const buffer = await jpegBlob.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);

    const imageData: ImageData = {
      url,
      mimeType: 'image/jpeg',
      base64
    };

    // Salva in cache (con limite max 50 immagini per contenere l'uso di RAM)
    if (imageMemoryCache.size > 50) {
      const firstKey = imageMemoryCache.keys().next().value;
      if (firstKey) imageMemoryCache.delete(firstKey);
    }
    imageMemoryCache.set(url, imageData);

    return imageData;
  } catch (error) {
    console.error(`[Vinted AI Lens] Fallito download o conversione immagine: ${url}`, error);
    throw error;
  }
}

// Router dei messaggi tra Content Script, Side Panel e Service Worker
chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  // 1. Download batch e conversione in Base64 delle immagini
  if (message.type === 'FETCH_IMAGES_BASE64') {
    (async () => {
      try {
        const urls = message.urls || [];
        const results: ImageData[] = [];

        // Esegui i download in parallelo (max 8 contemporanei per rispettare le connessioni HTTP)
        const batchSize = 6;
        for (let i = 0; i < urls.length; i += batchSize) {
          const chunk = urls.slice(i, i + batchSize);
          const chunkResults = await Promise.allSettled(chunk.map(url => fetchAndEncodeImage(url)));

          for (const res of chunkResults) {
            if (res.status === 'fulfilled') {
              results.push(res.value);
            }
          }
        }

        sendResponse({ ok: true, images: results });
      } catch (err) {
        sendResponse({ ok: false, error: (err as Error).message });
      }
    })();
    return true; // Asincrono
  }

  // 2. Esecuzione dell'analisi AI tramite AIProviderFactory
  if (message.type === 'ANALYZE_REQUEST') {
    (async () => {
      try {
        const { request } = message;
        console.log(`[Vinted AI Lens] Avvio analisi con provider: ${request.config.providerId}`);

        // Istanzia il provider corretto
        const provider = AIProviderFactory.create(request.config);

        // Se le immagini nel payload non hanno ancora il Base64 (es. solo URL), scaricale ora
        if (request.images.length === 0 && request.item.imageUrls?.length > 0) {
          const fetchedImages: ImageData[] = [];
          for (const url of request.item.imageUrls.slice(0, 10)) { // Limita a max 10 foto per token/budget
            try {
              const img = await fetchAndEncodeImage(url);
              fetchedImages.push(img);
            } catch {
              // Continua con le altre immagini
            }
          }
          request.images = fetchedImages;
        }

        // Esegui l'analisi multimodale
        const result = await provider.analyze(request);
        sendResponse({ ok: true, result });
      } catch (err) {
        console.error('[Vinted AI Lens] Errore analisi AI:', err);
        sendResponse({ ok: false, error: (err as Error).message });
      }
    })();
    return true; // Asincrono
  }

  return false;
});
