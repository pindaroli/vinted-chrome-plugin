# Vinted Chrome Plugin (Vinted AI Lens) 🔍🤖

Estensione Chrome (Manifest V3) open source per l'analisi visiva e documentale automatizzata degli articoli su Vinted, con supporto a modelli AI multimodali (Google Gemini, OpenAI, Ollama, LM Studio, Custom HTTP Server) e interfaccia reattiva integrata nel Chrome Side Panel.

---

## ✨ Funzionalità Principali

- **Analisi Multimodale Intelligente:** Ispezione delle foto dell'annuncio (etichette, tessuti, dettagli, imperfezioni) e del testo (titolo, descrizione, specifiche) tramite modelli Vision avanzati.
- **Supporto AI Pluggabile & Locale:**
  - **Google Gemini API** (es. `gemini-2.5-flash`, `gemini-1.5-pro`)
  - **OpenAI & Provider Compatibili** (OpenAI GPT-4o, Groq, OpenRouter)
  - **Local AI (Zero-Cost / Privacy First):** Supporto integrato a **Ollama** e **LM Studio** (es. `qwen2.5-vl`, `llava`, `minicpm-v`).
  - **Custom REST Endpoint:** Possibilità di agganciare webhook o microservizi proprietari.
- **Estrazione DOM Passiva (Zero Bot Footprint):**
  - Nessuna chiamata di scraping a endpoint protetti da antibot (DataDome).
  - Algoritmo a *puntamento diretto* per isolare con precisione chirurgica le sole foto dell'annuncio ed escludere avatar o caroselli di raccomandazioni.
- **Normalizzazione & Transcodifica Automatica Immagini:**
  - Conversione automatica in memoria tramite `OffscreenCanvas` di formati compressi CDN (AVIF/WebP) in formato standard `image/jpeg`, garantendo la compatibilità con tutti i modelli locali.
- **Interfaccia Side Panel Reattiva:** Costruita in React 19 + Tailwind CSS, con timer in tempo reale, audit scorecard (1-10), rilevamento incongruenze e copia del report.

---

## 🛠️ Stack Tecnologico

- **Bundler:** Vite 6 + `@crxjs/vite-plugin` (Manifest V3)
- **Frontend:** React 19, Tailwind CSS 3, Lucide React
- **Validazione & Schemi:** Zod
- **Testing:** Vitest con `@testing-library/react` e `happy-dom`

---

## 🚀 Installazione & Sviluppo

### Prerequisiti
- Node.js >= 18
- npm

### 1. Installazione dipendenze e Build
```bash
# Clona il repository
git clone https://github.com/pindaroli/vinted-chrome-plugin.git
cd vinted-chrome-plugin

# Installa i pacchetti
npm install

# Esegui la build di produzione
npm run build
```

### 2. Caricamento in Google Chrome
1. Apri Google Chrome e naviga su `chrome://extensions/`.
2. Attiva la modalità sviluppatore (**Developer mode**) in alto a destra.
3. Fai clic su **Carica estensione non compattata** (*Load unpacked*).
4. Seleziona la cartella `dist/` generata dal comando di build.
5. Apri qualsiasi annuncio su Vinted e clicca sull'icona dell'estensione per aprire il Side Panel!

---

## 🧪 Testing

```bash
# Esecuzione della suite di test automatizzati
npm test

# Esecuzione in modalità watch
npm run test:watch
```

---

## 🔒 Sicurezza & Privacy

- **Nessuna credenziale salvata sul repository:** Le API key vengono configurate dall'utente nel Side Panel e salvate unicamente nel local storage del browser (`chrome.storage.local`).
- **Nessun tracking:** L'estensione non traccia l'utente né invia telemetria a server terzi al di fuori del provider AI scelto esplicitamente.

---

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per ulteriori dettagli.
