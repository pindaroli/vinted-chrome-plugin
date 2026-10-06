import { VintedItemData } from './types';

/**
 * Content Script per Vinted AI Lens
 * 
 * SICUREZZA & ZERO BOT FOOTPRINT:
 * Non esegue alcuna richiesta HTTP esterna verso rotte API o backend di Vinted per evitare DataDome.
 * Ispeziona esclusivamente lo stato idratato già presente nei tag <script> e il DOM renderizzato.
 */

// Estrae l'ID dell'articolo dalla URL corrente (es. /items/12345678-nome-articolo)
function extractItemIdFromUrl(url: string): string {
  const match = url.match(/\/items\/(\d+)/i);
  return match ? match[1] : '';
}

/**
 * 1. Estrazione dallo schema JSON-LD (Product / ItemPage)
 */
function extractFromJsonLd(): Partial<VintedItemData> | null {
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
      const content = script.textContent?.trim();
      if (!content) continue;

      const data = JSON.parse(content);
      // Può essere un singolo oggetto o un array
      const product = Array.isArray(data) 
        ? data.find(item => item['@type'] === 'Product') 
        : (data['@type'] === 'Product' ? data : null);

      if (product) {
        const title = product.name || '';
        const description = product.description || '';
        const brand = typeof product.brand === 'object' ? product.brand?.name : (product.brand || '');
        const price = product.offers?.price ? String(product.offers.price) : '';
        const currency = product.offers?.priceCurrency || 'EUR';

        let imageUrls: string[] = [];
        if (Array.isArray(product.image)) {
          imageUrls = product.image.map(String);
        } else if (typeof product.image === 'string') {
          imageUrls = [product.image];
        }

        return {
          title,
          description,
          brand,
          price,
          currency,
          imageUrls,
          extractionSource: 'json-ld'
        };
      }
    }
  } catch (err) {
    console.warn('[Vinted AI Lens] Errore parsing JSON-LD:', err);
  }
  return null;
}

/**
 * 2. Estrazione dallo stato idratato Next.js (__NEXT_DATA__) o blocchi di stato applicativi
 */
function extractFromHydratedState(): Partial<VintedItemData> | null {
  try {
    // Controllo tag __NEXT_DATA__
    const nextDataScript = document.getElementById('__NEXT_DATA__');
    if (nextDataScript && nextDataScript.textContent) {
      const parsed = JSON.parse(nextDataScript.textContent);
      const itemProps = parsed?.props?.pageProps?.item || parsed?.props?.pageProps?.initialState?.item;
      if (itemProps) {
        const photos = Array.isArray(itemProps.photos) 
          ? itemProps.photos.map((p: { full_size_url?: string; url?: string }) => p.full_size_url || p.url).filter(Boolean)
          : [];

        return {
          id: String(itemProps.id || ''),
          title: itemProps.title || '',
          description: itemProps.description || '',
          price: String(itemProps.price?.amount || itemProps.price || ''),
          currency: itemProps.price?.currency_code || itemProps.currency || 'EUR',
          brand: itemProps.brand_title || itemProps.brand?.title || '',
          size: itemProps.size_title || itemProps.size || '',
          condition: itemProps.status || itemProps.status_description || '',
          imageUrls: photos,
          extractionSource: 'next-data'
        };
      }
    }

    // Ispezione di script inline contenenti window.__INITIAL_STATE__ o pattern Vinted
    const allScripts = document.querySelectorAll('script:not([src])');
    for (const s of Array.from(allScripts)) {
      const text = s.textContent || '';
      if (text.includes('__VINTED_STATE__') || text.includes('initialState') || text.includes('itemDto')) {
        const jsonMatch = text.match(/\{.*"title":.*"photos":.*\}/s);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.title) {
              return {
                title: parsed.title,
                description: parsed.description,
                brand: parsed.brand_title,
                price: String(parsed.price?.amount || parsed.price || ''),
                extractionSource: 'vinted-state'
              };
            }
          } catch {
            // Continua
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Vinted AI Lens] Errore parsing Hydrated State:', err);
  }
  return null;
}

/**
 * Estrae una chiave identificativa univoca dell'immagine Vinted ignorando risoluzioni e query params.
 */
function getImageKey(url: string): string {
  try {
    const parsed = new URL(url);
    let p = parsed.pathname;
    return p.replace(/\/(f800|f400|f200|thumb\/[^/]+)\//, '/');
  } catch {
    return url.replace(/\/(f800|f400|f200|thumb\/[^/]+)\//, '/');
  }
}

/**
 * Normalizza l'URL delle immagini Vinted puntando alla massima qualità f800
 */
function normalizeImageUrl(url: string): string {
  return url
    .replace(/\/thumb\/[^/]+\//, '/f800/')
    .replace(/\/f200\//, '/f800/')
    .replace(/\/f400\//, '/f800/');
}

/**
 * 3. Estrazione avanzata e circoscritta delle sole immagini dell'annuncio tramite Puntamento Diretto
 */
function extractGalleryImages(): string[] {
  const urls: string[] = [];
  const seenKeys = new Set<string>();

  // 1. Individuazione del Contenitore Specifico della galleria dell'articolo
  const galleryContainers = document.querySelectorAll<HTMLElement>(
    '[data-testid="item-photos"], [data-testid="item-photo--list"], [data-testid="item-gallery"], ' +
    '.item-photos, .item-photos__container, .item-photos-wrapper, .item-gallery-wrapper, .item-gallery'
  );

  let candidateImages: HTMLImageElement[] = [];

  // Se troviamo uno o più contenitori della galleria principale, estraiamo le immagini SOLO da essi
  if (galleryContainers.length > 0) {
    for (const container of Array.from(galleryContainers)) {
      const imgs = container.querySelectorAll<HTMLImageElement>('img');
      for (const img of Array.from(imgs)) {
        candidateImages.push(img);
      }
    }
  } else {
    // 2. Fallback: cerca immagini all'interno di tag semantici <figure img> che sono tipici della galleria principale Vinted
    // Limitiamo ai <figure> che non sono in sezioni palesemente non pertinenti (header, footer, avatar)
    const figures = document.querySelectorAll<HTMLElement>('main figure, [data-testid="item-main"] figure');
    for (const figure of Array.from(figures)) {
        const img = figure.querySelector('img');
        if (img) candidateImages.push(img);
    }
  }

  // Estrazione e deduplicazione degli URL
  for (const img of candidateImages) {
    // 1. Controlla srcset per ottenere la massima risoluzione disponibile
    let chosenUrl = '';
    const srcset = img.getAttribute('srcset') || img.srcset;
    if (srcset) {
      const sources = srcset.split(',').map(s => s.trim());
      const highestRes = sources[sources.length - 1]?.split(' ')[0];
      if (highestRes && highestRes.startsWith('http')) {
        chosenUrl = highestRes;
      }
    }

    // 2. Controllo attributi vari
    if (!chosenUrl) {
      chosenUrl = img.getAttribute('data-full-image') ||
                  img.getAttribute('data-src') ||
                  img.getAttribute('src') || '';
    }

    if (chosenUrl && chosenUrl.startsWith('http')) {
      const normalized = normalizeImageUrl(chosenUrl);
      const key = getImageKey(normalized);
      
      // Assicuriamoci che non sia un avatar o logo Vinted catturato per errore nel fallback
      if (
        !key.includes('/users/') && 
        !key.includes('/user_photos/') &&
        !key.includes('avatar') &&
        !key.includes('logo') &&
        !seenKeys.has(key)
      ) {
        seenKeys.add(key);
        urls.push(normalized);
      }
    }
  }

  return urls;
}

/**
 * 4. Fallback semantico su selettori DOM visibili
 */
function extractFromSemanticDom(): {
  title: string;
  price: string;
  currency: string;
  brand: string;
  size: string;
  condition: string;
  description: string;
  details: Record<string, string>;
} {
  // Titolo
  const titleEl = document.querySelector('h1, [data-testid="item-title"], .item-description-title');
  const title = titleEl?.textContent?.trim() || '';

  // Prezzo
  const priceEl = document.querySelector('[data-testid="item-price"], .item-price, h2.web_ui__Text__title');
  const priceText = priceEl?.textContent?.trim() || '';
  let currency = 'EUR';
  if (priceText.includes('€')) currency = 'EUR';
  else if (priceText.includes('£')) currency = 'GBP';
  else if (priceText.includes('$')) currency = 'USD';
  const cleanPrice = priceText.replace(/[^0-9.,]/g, '').trim();

  // Descrizione
  const descEl = document.querySelector('[data-testid="item-description"], .item-description, div[itemprop="description"]');
  const description = descEl?.textContent?.trim() || '';

  // Tabella attributi e dettagli Vinted (supporta sia 'Chiave: Valore' che coppie di elementi figli)
  const details: Record<string, string> = {};
  let brand = '';
  let size = '';
  let condition = '';

  // Scansiona sezioni dettagli e coppie chiave/valore
  const detailRows = document.querySelectorAll(
    '.details-list__item, [data-testid^="item-attributes"], .cell--key, div[class*="Details-item"], div[class*="Cell__cell"]'
  );

  detailRows.forEach(row => {
    let k = '';
    let v = '';
    const text = row.textContent?.trim() || '';

    if (text.includes(':')) {
      const parts = text.split(':').map(s => s.trim());
      k = parts[0];
      v = parts.slice(1).join(':').trim();
    } else if (row.children.length >= 2) {
      k = row.children[0].textContent?.trim() || '';
      v = row.children[1].textContent?.trim() || '';
    }

    if (k && v) {
      details[k] = v;
      const lowerK = k.toLowerCase();
      if (!brand && (lowerK.includes('brand') || lowerK.includes('marca') || lowerK.includes('marque') || lowerK.includes('marke'))) {
        brand = v;
      }
      if (!size && (lowerK.includes('size') || lowerK.includes('taglia') || lowerK.includes('taille') || lowerK.includes('größe'))) {
        size = v;
      }
      if (!condition && (lowerK.includes('cond') || lowerK.includes('stato') || lowerK.includes('état') || lowerK.includes('etat') || lowerK.includes('zustand'))) {
        condition = v;
      }
    }
  });

  // Ricerca specifica per campi chiave se ancora non trovati
  if (!brand) {
    const brandEl = document.querySelector('[data-testid="item-brand"], [itemprop="brand"]');
    if (brandEl) brand = brandEl.textContent?.trim() || '';
  }

  if (!size) {
    const sizeEl = document.querySelector('[data-testid="item-size"]');
    if (sizeEl) size = sizeEl.textContent?.trim() || '';
  }

  if (!condition) {
    const statusEl = document.querySelector('[data-testid="item-status"]');
    if (statusEl) condition = statusEl.textContent?.trim() || '';
  }

  return {
    title,
    price: cleanPrice,
    currency,
    brand,
    size,
    condition,
    description,
    details
  };
}

/**
 * Funzione principale che orchestra l'estrazione combinando stato idratato e DOM fallback
 */
export function extractVintedItemData(): VintedItemData {
  const url = window.location.href;
  const id = extractItemIdFromUrl(url) || `vinted-${Date.now()}`;

  const jsonLd = extractFromJsonLd();
  const hydrated = extractFromHydratedState();
  const dom = extractFromSemanticDom();
  const galleryImages = extractGalleryImages();

  // Combina le fonti con priorità: Stato idratato > JSON-LD > DOM Visibile
  const finalTitle = hydrated?.title || jsonLd?.title || dom.title || document.title;
  const finalPrice = hydrated?.price || jsonLd?.price || dom.price || '0';
  const finalCurrency = hydrated?.currency || jsonLd?.currency || dom.currency || 'EUR';
  const finalBrand = hydrated?.brand || jsonLd?.brand || dom.brand || 'Non specificato';
  const finalSize = hydrated?.size || dom.size || 'Non specificata';
  const finalCondition = hydrated?.condition || dom.condition || 'Non specificata';
  const finalDescription = hydrated?.description || jsonLd?.description || dom.description || '';

  // SELEZIONE DELLE IMMAGINI DELL'ARTICOLO
  let finalImages = [...galleryImages];

  // Se galleryImages è vuoto, usa le immagini da JSON-LD
  if (finalImages.length === 0 && jsonLd?.imageUrls?.length) {
    finalImages = jsonLd.imageUrls.map(normalizeImageUrl);
  } else if (jsonLd?.imageUrls?.length) {
    // Altrimenti verifica se JSON-LD contiene un'immagine di copertina non ancora inclusa
    for (const jImg of jsonLd.imageUrls) {
      const normJ = normalizeImageUrl(jImg);
      const jKey = getImageKey(normJ);
      if (!finalImages.some(img => getImageKey(img) === jKey)) {
        finalImages.unshift(normJ);
      }
    }
  }

  // Se ancora vuoto, usa lo stato idratato
  if (finalImages.length === 0 && hydrated?.imageUrls?.length) {
    finalImages = hydrated.imageUrls.map(normalizeImageUrl);
  }

  const source = hydrated?.extractionSource || (galleryImages.length > 0 ? 'dom-gallery' : jsonLd?.extractionSource || 'dom-fallback');

  return {
    id,
    title: finalTitle,
    description: finalDescription,
    price: finalPrice,
    currency: finalCurrency,
    brand: finalBrand,
    size: finalSize,
    condition: finalCondition,
    details: dom.details,
    imageUrls: finalImages,
    url,
    extractedAt: new Date().toISOString(),
    extractionSource: source
  };
}

// Ascolto messaggi dal background service worker o dal side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_ITEM_DATA') {
    try {
      const data = extractVintedItemData();
      sendResponse({ ok: true, data });
    } catch (err) {
      sendResponse({ ok: false, error: (err as Error).message });
    }
  }
  return true; // Risposta asincrona consentita
});

console.log('[Vinted AI Lens] Content script iniettato e in ascolto su:', window.location.href);
