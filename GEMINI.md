# Vinted AI Lens — Architecture & Developer Guide

Estensione Chrome (Manifest V3) per l'analisi visiva e documentale automatizzata di articoli su Vinted, con supporto a modelli AI multimodali (Google Gemini, OpenAI, Ollama, LM Studio, Custom HTTP Server) e rendering reattivo via Side Panel.

---

## ⚠️ Regole di Ingaggio (User Validation & Trasparenza)
1. **Validazione delle Scelte Architetturali:** Qualsiasi scelta architetturale o di implementazione tecnica significativa DEVE essere prima sottoposta all'utente. L'agente non deve procedere con l'implementazione o la modifica dei file finché l'utente non ha esplicitamente validato e approvato il piano d'azione (tramite un `/plan` o una descrizione scritta).
2. **Analisi dei Fallimenti e dei Test:** Quando si riscontra un bug in produzione che i test automatizzati non hanno catturato, l'agente è tenuto a:
   - Spiegare all'utente **perché** i test esistenti non hanno individuato l'errore (es. mock del DOM troppo irrealistico, assunzioni errate).
   - Proporre un piano per correggere sia il codice applicativo che la suite di test.
   - Effettuare ricerche sul web, se necessario, per comprendere al meglio la struttura reale delle pagine o delle API coinvolte prima di proporre la soluzione.

---

## 🛠️ Stack Tecnologico

- **Bundler & Build Tool:** [Vite 6](https://vitejs.dev/) con [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin) per la compilazione di Chrome Extensions Manifest V3.
- **UI Framework:** [React 19](https://react.dev/) (`react`, `react-dom`, `@vitejs/plugin-react`).
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) (`tailwindcss`, `postcss`, `autoprefixer`) con palette dark integrata (slate/sky/teal).
- **Iconografia:** [Lucide React](https://lucide.dev/) (`lucide-react`) per icone SVG nitide, leggere e scalabili.
- **Validazione & Schemi Runtime:** [Zod](https://zod.dev/) per type safety rigorosa e parsing garantito dei dati di scraping e degli output JSON dei modelli AI.
- **Testing Framework:** [Vitest](https://vitest.dev/) con `@testing-library/react`, `@testing-library/jest-dom` e `happy-dom`.

---

## 🏛️ Architettura del Progetto

```
vinted-chrome-plugin/
├── manifest.json                  # Manifest V3 (permissions: sidePanel, storage, activeTab, host_permissions)
├── vite.config.ts                 # Configurazione Vite con React + CRXJS plugin
├── vitest.config.ts               # Configurazione Vitest con happy-dom e test setup
├── tailwind.config.js             # Configurazione Tailwind CSS
├── postcss.config.js              # Configurazione PostCSS
├── tsconfig.json                  # Configurazione TypeScript con jsx: react-jsx
├── package.json                   # Script di build e dipendenze
├── test/                          # Suite di test unitari e di componenti
│   ├── setup.ts                   # Mocking globale delle API Chrome (storage, runtime, tabs)
│   ├── schemas.test.ts            # Test di validazione Zod per ProviderConfig, ItemData e AnalysisResult
│   ├── presets.test.ts            # Test di costruzione prompt e sanitizzazione risposte LLM
│   ├── content.test.ts            # Test di isolamento immagini dell'annuncio ed esclusione avatar/raccomandazioni
│   └── ItemCard.test.tsx          # Test di rendering React con React Testing Library
└── src/
    ├── background.ts              # Service Worker: fetch binario immagini -> Base64, orchestrazione AI
    ├── content.ts                 # Content script passivo: estrazione DOM/Next.js/JSON-LD senza bot footprint
    ├── schemas/                   # Schemi Zod di dominio
    │   ├── provider.schema.ts     # Configurazione connessione AI e preset
    │   ├── item.schema.ts         # Modello dati articolo Vinted e immagini Base64
    │   └── analysis.schema.ts     # Schema di output strutturato dell'analisi AI
    ├── types/
    │   └── index.ts               # Tipi TypeScript inferiti da Zod e messaggi di Chrome Runtime
    ├── prompts/
    │   └── presets.ts             # Istruzioni di sistema specializzate (Full Audit, Autenticità, Tessuti, Difetti)
    ├── services/
    │   └── ai/                    # Adapter e factory per i provider AI
    │       ├── factory.ts         # AIProviderFactory per istanziazione dinamica
    │       ├── gemini.provider.ts # Client per Google Gemini REST v1beta (generateContent)
    │       ├── openai-compatible.provider.ts # Client compatibile OpenAI, Ollama, LM Studio
    │       ├── custom-http.provider.ts       # Client per webhook o server REST custom
    │       └── provider.interface.ts         # Interfaccia comune AIProvider
    └── sidepanel/                 # Interfaccia grafica Side Panel in React
        ├── index.html             # Entry point HTML (<div id="root"></div>)
        ├── index.css              # Entry point CSS con direttive Tailwind
        ├── main.tsx               # Root mount dell'applicazione React
        ├── App.tsx                # Layout principale, routing tab e coordinamento analisi
        ├── hooks/                 # Custom React Hooks
        │   ├── useProviderConfig.ts # Sincronizzazione configurazione con chrome.storage.local
        │   ├── useModelList.ts      # Listing dinamico dei modelli con cache e debounce
        │   └── useVintedItem.ts     # Rilevamento automatico articolo attivo tramite tab listeners
        └── components/            # Componenti UI
            ├── Header.tsx         # Intestazione con badge stato provider/modello attivo
            ├── ItemCard.tsx       # Anteprima dell'articolo rilevato (gallery, dettagli, prezzo)
            ├── AnalysisControls.tsx # Selezione preset di verifica e prompt personalizzato
            ├── AnalysisProgress.tsx # Feedback visivo e barra di caricamento durante l'elaborazione AI
            ├── AnalysisResultView.tsx # Scheda di affidabilità (1-10), verifica brand/taglia, difetti, copia report
            └── SettingsTab.tsx    # Form impostazioni provider con pull-down modelli dinamico
```

---

## 🧪 Strategia e Framework di Testing (Vitest)

### Perché Vitest?
1. **Nativo per Vite:** Sfrutta la stessa pipeline di build, supportando nativamente TypeScript, JSX di React 19, Tailwind e i path alias (`@/`) senza configurazioni duplicate o transpilatori esterni come Babel.
2. **Velocità Estrema:** Esecuzione multithreaded in-memory, con suite complete che terminano in meno di mezzo secondo.
3. **Mocking delle API Chrome:** `test/setup.ts` inietta un mock controllato in memoria di `chrome.storage.local`, `chrome.runtime` e `chrome.tabs`, rendendo i test indipendenti dall'ambiente browser.

### Suite di Test Implementate:
- **`test/schemas.test.ts`**: Verifica che Zod validi correttamente i default, rifiuti impostazioni invalide (come URL vuoti o punteggi fuori scala) e inferisca correttamente i tipi.
- **`test/presets.test.ts`**: Verifica la costruzione del prompt di sistema e utente e il parser JSON con tolleranza per risposte markdown (` ```json ... ``` `).
- **`test/content.test.ts`**: Simula una pagina HTML Vinted con `happy-dom` e verifica che l'algoritmo di scraping catturi **esclusivamente le foto dell'annuncio visualizzato**, scartando avatar del venditore e caroselli di raccomandazioni (altri articoli, articoli simili).
- **`test/ItemCard.test.tsx`**: Verifica il rendering del componente React dell'articolo, la presenza dei badge, il conteggio foto e lo stato di attesa/vuoto.

---

## 🔢 Regola di Versionamento Semantico Automatico (Build Versioning)

Per garantire la tracciabilità immediata di ogni rilascio sia in Chrome (`chrome://extensions/`) che nell'interfaccia Side Panel:
1. **Auto-Increment della Patch ad ogni Build:** Ogni esecuzione di `npm run build` esegue preliminarmente lo script `scripts/bump-version.js`.
2. **Sincronizzazione Atomica:** Lo script aggiorna la versione semantica (`MAJOR.MINOR.PATCH`, es. `1.0.0` -> `1.0.1` -> `1.0.2`...) contemporaneamente su:
   - `package.json` (`version`)
   - `manifest.json` (obbligatorio per Manifest V3 e per l'ispettore delle estensioni di Chrome)
   - `src/version.ts` (esporta le costanti tipizzate `APP_VERSION` e `BUILD_TIMESTAMP`)
3. **Visibilità nel Side Panel:** `Header.tsx` importa `APP_VERSION` e renderizza un badge dedicato posizionato direttamente dopo il titolo:
   `Vinted AI Lens v1.0.X [PRO]`. Questo consente all'utente e agli sviluppatori di confermare a colpo d'occhio che l'estensione ricaricata corrisponda all'ultima build generata.

---

## 📷 Logica di Isolamento Foto (Anti-Contaminazione & Anti-Raccomandazioni)

> **⚠️ Post-Mortem: Fallimento dell'approccio a "Blacklist" (Filtri Multipli)**
> Inizialmente, il sistema usava un approccio a *blacklist* con 5 livelli di filtraggio (ricerca di nodi antenati con link ad altri articoli, controllo boundary rispetto alla descrizione, ecc.). 
> **Perché ha fallito in produzione?** Su Vinted, la galleria principale e le raccomandazioni (es. "Articoli dell'utente") condividono spesso contenitori *wrapper* di livello superiore (es. la colonna principale della pagina). I test (in `test/content.test.ts`) non catturavano questo errore perché simulavano una struttura del DOM ideale, con la galleria e le raccomandazioni su rami dell'albero HTML completamente separati. In produzione, il controllo rigoroso sugli antenati finiva per etichettare le vere foto dell'articolo come "raccomandazioni", scartandole e forzando il fallback al JSON-LD (che contiene una sola immagine).

### Nuovo Approccio: "Puntamento Diretto" (Whitelist)
Per garantire che all'AI vengano inoltrate **esclusivamente le foto reali dell'articolo**, il Content Script adotta un approccio a **selezione diretta del contenitore**:

1. **Individuazione del Contenitore Specifico:** Invece di interrogare globalmente la pagina con `querySelectorAll('img')` e applicare filtri sottrattivi, l'algoritmo cerca i container noti (es. selettori `[data-testid="item-photos"]`, classi come `item-photos` o la grid principale del prodotto).
2. **Estrazione Isolata:** Vengono estrapolate unicamente le immagini `<img>` discendenti da questo specifico container. Tutto il resto del DOM della pagina (inclusi i caroselli degli articoli consigliati) viene ignorato a priori.
3. **Deduplicazione Intelligente (`getImageKey`):** Gli URL delle immagini vengono normalizzati alla massima qualità (es. `f800`) e confrontati tramite il loro hash di risorsa, impedendo la duplicazione della cover anche in presenza di tag JSON-LD.

---

## 🖼️ Compatibilità Formati Immagine (Ollama / Local AI)

> **⚠️ Problema Noto: Errore 400 "Failed to load image or audio file" su Ollama**
> L'estensione scarica le immagini dalla CDN di Vinted. Spesso, Vinted fornisce immagini in formati iper-compressi (come **AVIF** o **WebP**), che sono supportati nativamente dai browser ma spesso **non sono supportati** dalle librerie interne (es. PIL/Pillow) usate dai modelli visivi locali in Ollama o LM Studio (come LLaVA o Qwen). Questo causa un fallimento immediato dell'API `/v1/chat/completions`.

### Soluzione Architetturale: Transcodifica Obbligatoria (OffscreenCanvas)
Per garantire la totale compatibilità dell'estensione con **qualsiasi** provider locale o cloud, il Service Worker implementa una pipeline di normalizzazione delle immagini prima di inviarle al LLM:

1. **Forzatura Headers:** In fase di download (`fetch`), l'header `Accept` viene limitato a `image/jpeg,image/png,image/webp,*/*;q=0.8` per disincentivare l'invio di AVIF.
2. **Decodifica e Rasterizzazione:** Indipendentemente dal formato ricevuto (AVIF/WebP), il Blob viene convertito in un `ImageBitmap` e disegnato su un `OffscreenCanvas` (API nativa disponibile nei Service Worker Manifest V3).
3. **Esportazione Standardizzata:** Il canvas viene esportato forzatamente come Blob in formato `image/jpeg` (qualità 90%) e poi codificato in Base64.
4. **Risultato:** Il payload inviato a Ollama conterrà *sempre* la stringa sicura `data:image/jpeg;base64,...`, azzerando gli errori di compatibilità.

---

## 🤖 Listing Dinamico dei Modelli Multimodali

Nel Side Panel (scheda *Impostazioni*), il campo **Nome Modello Multimodale** è un elemento a tendina (pull-down) popolato dinamicamente:
- **Google Gemini:** Chiama `GET ${baseUrl}/models?pageSize=1000&key=${apiKey}` (conforme a `ModelService.ListModels`), filtrando i modelli che supportano `generateContent` (es. `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`) ed eliminando il prefisso `models/`.
- **OpenAI-Compatible (Ollama, LM Studio, OpenAI):** Chiama `GET ${baseUrl}/models` (con fallback su `/v1/models`) per estrarre tutti i modelli scaricati/disponibili.
- **Pulsante Refresh:** Un pulsante `RotateCw` permette di rieseguire la scansione in tempo reale dei modelli senza dover riavviare l'estensione.

---

## 🚀 Comandi per lo Sviluppo

```bash
# Esecuzione dei test unitari e di componente
npm test

# Esecuzione dei test in modalità watch (TDD)
npm run test:watch

# Compilazione di produzione dell'estensione (output in dist/)
npm run build

# Avvio server Vite in dev mode
npm run dev
```

### Installazione dell'Estensione in Chrome:
1. Apri Google Chrome e naviga su `chrome://extensions/`.
2. Attiva la modalità sviluppatore (*Developer mode*) in alto a destra.
3. Fai clic su **Carica estensione non compattata** (*Load unpacked*).
4. Seleziona la cartella `dist/` generata dal comando `npm run build`.
