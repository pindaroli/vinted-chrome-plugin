import { describe, it, expect, beforeEach } from 'vitest';
import { extractVintedItemData } from '../src/content';

describe('Vinted Content Script - Real-World Extraction & Recommendation Isolation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('dovrebbe isolare con precisione chirurgica le 2 sole foto dell\'annuncio ed escludere avatar e caroselli raccomandati reali', () => {
    const currentItemId = '5426189512';

    Object.defineProperty(window, 'location', {
      value: {
        href: `https://www.vinted.fr/items/${currentItemId}-ventilateur-de-refroidissement-pour-pc`,
      },
      writable: true,
    });

    // Simulazione fedele al DOM reale di Vinted (React + web_ui + caroselli multipli)
    // In produzione, la galleria e i caroselli condividono spesso lo stesso wrapper di colonna principale.
    document.body.innerHTML = `
      <header>
        <nav>
          <a href="/member/1000-mio-profilo">
            <img src="https://images1.vinted.net/t/users/my-avatar.jpg" alt="Il mio profilo" />
          </a>
        </nav>
      </header>

      <main class="item-page">
        <div class="main-column-wrapper">
          <!-- COLONNA FOTO PRODOTTO (Struttura reale Vinted: figure.item-photo) -->
          <div class="item-photos" data-testid="item-photos">
            <figure class="item-photo item-photo--1">
              <div class="item-photo-wrapper">
                <img 
                  src="https://images1.vinted.net/t/01_front/f800/1741234567.jpeg" 
                  srcset="https://images1.vinted.net/t/01_front/f400/1741234567.jpeg 400w, https://images1.vinted.net/t/01_front/f800/1741234567.jpeg 800w"
                  alt="Noctua front in confezione" 
                />
              </div>
            </figure>
            <figure class="item-photo item-photo--2">
              <div class="item-photo-wrapper">
                <img 
                  src="https://images1.vinted.net/t/02_back/f800/1741234568.jpeg" 
                  srcset="https://images1.vinted.net/t/02_back/f400/1741234568.jpeg 400w, https://images1.vinted.net/t/02_back/f800/1741234568.jpeg 800w"
                  alt="Noctua retro e specifiche" 
                />
              </div>
            </figure>
          </div>

          <!-- COLONNA DETTAGLI E VENDITORE (Normalmente a lato, ma nel DOM precede i caroselli) -->
          <div class="item-sidebar">
            <h1 data-testid="item-title">Ventilateur de refroidissement pour PC</h1>
            <div data-testid="item-price">8,99 €</div>

            <div class="user-box">
              <a href="/member/442211-jean-seller">
                <img src="https://images1.vinted.net/t/users/442211/avatar-jean.jpg" alt="Avatar di jean-seller" />
                <span>jean-seller</span>
              </a>
            </div>

            <!-- TABELLA ATTRIBUTI -->
            <div class="details-list">
              <div class="details-list__item">
                <div class="cell--key">Marque</div>
                <div class="cell--value">Noctua</div>
              </div>
              <div class="details-list__item">
                <div class="cell--key">État</div>
                <div class="cell--value">Très bon état</div>
              </div>
              <div class="details-list__item">
                <div class="cell--key">Taille</div>
                <div class="cell--value">120 mm</div>
              </div>
            </div>

            <!-- DESCRIZIONE -->
            <div data-testid="item-description" class="item-description">
              Ventilateur Noctua NF-F12 120mm pour boîtier ou radiateur. Fonctionne parfaitement, fourni dans sa boîte d'origine.
            </div>
          </div>

          <!-- CAROSELLO 1: ARTICLES SIMILAIRES (Condivide lo stesso wrapper main-column-wrapper, posizionato sotto) -->
          <section class="web_ui__Carousel__carousel section-similar">
            <div class="section-header">
              <h2 class="web_ui__Text__title">Articles similaires</h2>
            </div>
            <div class="carousel-track">
              <!-- Card 1: Felpa blu (link fratello di img, non genitore diretto) -->
              <div class="web_ui__ItemBox__box">
                <div class="web_ui__ItemBox__image-container">
                  <img src="https://images1.vinted.net/t/03/f800/felpa-blu-vintage.jpg" alt="Felpa blu" />
                </div>
                <div class="web_ui__ItemBox__details">
                  <span class="price">15,00 €</span>
                  <a href="/items/8888888-felpa-blu-vintage" class="web_ui__ItemBox__overlay">Felpa blu vintage</a>
                </div>
              </div>

              <!-- Card 2: Top leopardo -->
              <div class="web_ui__ItemBox__box">
                <div class="web_ui__ItemBox__image-container">
                  <img src="https://images1.vinted.net/t/04/f800/top-leopardo.jpg" alt="Top leopardo" />
                </div>
                <div class="web_ui__ItemBox__details">
                  <span class="price">12,00 €</span>
                  <a href="/items/9999999-top-leopardo" class="web_ui__ItemBox__overlay">Top maculato</a>
                </div>
              </div>

              <!-- Card 3: Borsa nera -->
              <div class="web_ui__ItemBox__box">
                <div class="web_ui__ItemBox__image-container">
                  <img src="https://images1.vinted.net/t/05/f800/borsa-nera.jpg" alt="Borsa a tracolla" />
                </div>
                <div class="web_ui__ItemBox__details">
                  <span class="price">25,00 €</span>
                  <a href="/items/7777777-borsa-tracolla" class="web_ui__ItemBox__overlay">Borsa</a>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <!-- CAROSELLO 2: MEMBRES QUI AIMENT AUSSI (Altro blocco raccomandazioni) -->
      <section class="recommendations-block">
        <h3>Membres qui aiment aussi</h3>
        <div class="feed-grid">
          <div class="catalog-item">
            <img src="https://images1.vinted.net/t/06/f800/scarpe-bianche.jpg" alt="Scarpe sneakers" />
            <a href="/items/6666666-sneakers-bianche">Sneakers</a>
          </div>
          <div class="catalog-item">
            <img src="https://images1.vinted.net/t/07/f800/zaino-nero.jpg" alt="Zaino da lavoro" />
            <a href="/items/5555555-zaino-lavoro">Zaino</a>
          </div>
        </div>
      </section>
    `;

    const extracted = extractVintedItemData();

    // 1. Dettagli testuali estratti fedelmente
    expect(extracted.id).toBe(currentItemId);
    expect(extracted.title).toBe('Ventilateur de refroidissement pour PC');
    expect(extracted.price).toBe('8,99');
    expect(extracted.currency).toBe('EUR');
    expect(extracted.brand).toBe('Noctua');
    expect(extracted.condition).toBe('Très bon état');
    expect(extracted.size).toBe('120 mm');
    expect(extracted.description).toContain('Ventilateur Noctua NF-F12');
    expect(extracted.extractionSource).toBe('dom-gallery');

    // 2. ISOLAMENTO FOTOGRAFICO ASSOLUTO
    expect(extracted.imageUrls).toHaveLength(2);
    expect(extracted.imageUrls[0]).toBe('https://images1.vinted.net/t/01_front/f800/1741234567.jpeg');
    expect(extracted.imageUrls[1]).toBe('https://images1.vinted.net/t/02_back/f800/1741234568.jpeg');

    // 3. ZERO CONTAMINAZIONE DA AVATAR O CAROSELLI
    expect(extracted.imageUrls.some(u => u.includes('avatar'))).toBe(false);
    expect(extracted.imageUrls.some(u => u.includes('felpa'))).toBe(false);
    expect(extracted.imageUrls.some(u => u.includes('leopardo'))).toBe(false);
    expect(extracted.imageUrls.some(u => u.includes('borsa'))).toBe(false);
    expect(extracted.imageUrls.some(u => u.includes('scarpe'))).toBe(false);
    expect(extracted.imageUrls.some(u => u.includes('zaino'))).toBe(false);
  });

  it('dovrebbe gestire articoli con foto singola e deduplicare con JSON-LD senza creare doppioni', () => {
    const currentItemId = '33445566';

    Object.defineProperty(window, 'location', {
      value: {
        href: `https://www.vinted.it/items/${currentItemId}-maglione-lana`,
      },
      writable: true,
    });

    // Tag JSON-LD presente con URL a bassa risoluzione
    const jsonLdScript = document.createElement('script');
    jsonLdScript.type = 'application/ld+json';
    jsonLdScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Maglione lana vergine',
      image: ['https://images1.vinted.net/t/01_maglione/f400/foto.jpg'],
      offers: { price: '20.00', priceCurrency: 'EUR' }
    });
    document.head.appendChild(jsonLdScript);

    // Nel DOM è presente la stessa foto a risoluzione f800
    document.body.innerHTML = `
      <main>
        <div class="item-photos">
          <figure>
            <img src="https://images1.vinted.net/t/01_maglione/f800/foto.jpg" alt="Maglione" />
          </figure>
        </div>
        <h1 data-testid="item-title">Maglione lana vergine</h1>
        <div data-testid="item-description">Caldo maglione vintage.</div>
      </main>
      <div class="similar-items">
        <a href="/items/999-altro"><img src="https://images1.vinted.net/t/02_altro/f800/altro.jpg" /></a>
      </div>
    `;

    const extracted = extractVintedItemData();

    // Deve avere esattamente 1 foto (quella normalizzata a f800), non duplicata
    expect(extracted.imageUrls).toHaveLength(1);
    expect(extracted.imageUrls[0]).toBe('https://images1.vinted.net/t/01_maglione/f800/foto.jpg');
    expect(extracted.title).toBe('Maglione lana vergine');
  });
});
