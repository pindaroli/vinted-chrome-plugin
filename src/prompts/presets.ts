import {
  AnalysisPreset,
  AnalysisPresetId,
  AnalysisResult,
  AnalysisResultSchema,
  VintedItemData,
} from '../types';

/**
 * Libreria dei preset di analisi multimodale con istruzioni di sistema specializzate
 */
export const ANALYSIS_PRESETS: Record<AnalysisPresetId, AnalysisPreset> = {
  'full-audit': {
    id: 'full-audit',
    name: 'Audit Completo (Default)',
    description: 'Verifica OCR etichetta, conformità brand, taglia, composizione e difetti visibili.',
    systemPrompt: `Sei un perito esperto di abbigliamento, autenticazione moda e controllo qualità tessile.
Analizza accuratamente le fotografie dell'annuncio Vinted confrontandole con i dati dichiarati dal venditore.
Esegui OCR accurato su etichette interne, etichette del collo, cartellini e dettagli visibili.
Valuta coerenza tra marca dichiarata e marca visibile, taglia reale visibile su etichetta, composizione dei materiali, eventuali difetti, macchie o usura.
Devi restituire esclusivamente un JSON valido con lo schema richiesto.`,
    userPromptTemplate: `Effettua un audit completo di questo capo d'abbigliamento.`
  },
  'authenticity': {
    id: 'authenticity',
    name: 'Verifica Autenticità & Seriali',
    description: 'Focus su font loghi, cuciture, codici seriali/RN e indici di contraffazione.',
    systemPrompt: `Sei un perito specializzato in contrasto alla contraffazione e autenticazione di beni di lusso e streetwear.
Esamina con estrema precisione i dettagli macro delle foto: tipografia e font del logo, allineamento e densità delle cuciture, etichette di lavaggio con codici seriali/RN/CA/stile, incisioni su zip (es. YKK, Lampo, Riri) o bottoni.
Identifica qualsiasi anomalia che suggerisca una replica o contraffazione.
Devi restituire esclusivamente un JSON valido con lo schema richiesto.`,
    userPromptTemplate: `Verifica l'autenticità di questo articolo focalizzandoti su marchi, loghi, dettagli costruttivi e codici di serie.`
  },
  'composition': {
    id: 'composition',
    name: 'Composizione Tessile & Cura',
    description: 'Estrazione esatta delle percentuali di fibra tessile e simboli di lavaggio.',
    systemPrompt: `Sei un tecnologo tessile esperto nella lettura di etichette di composizione e cura capi.
Cerca ed esegui OCR ad altissima precisione sull'etichetta di composizione (tagliandino interno).
Estrai tutte le fibre tessili con le rispettive percentuali (es. "100% Cashmere", "98% Cotone, 2% Elastan").
Riconosci i simboli o le istruzioni di manutenzione (lavaggio, stiratura, lavaggio a secco) e verifica se la descrizione del venditore è veritiera.
Devi restituire esclusivamente un JSON valido con lo schema richiesto.`,
    userPromptTemplate: `Estrai con precisione la composizione dei tessuti e le indicazioni per la cura rilevate dalle etichette fotografate.`
  },
  'defects': {
    id: 'defects',
    name: 'Rilevamento Difetti & Usura',
    description: 'Ricerca di macchie, pilling, fori, usura di colletti o scolorimenti.',
    systemPrompt: `Sei un ispettore di controllo qualità su articoli di seconda mano.
Ispeziona metodicamente ogni centimetro visibile delle fotografie in cerca di:
1. Macchie, aloni o ingiallimenti (specialmente su ascelle, colletto, polsini).
2. Pilling (pelucchi), sfilacciature o buchi da tarme.
3. Usura su orli, ginocchia, gomiti, fondi dei pantaloni o tasche.
4. Tiranti di zip danneggiati, bottoni mancanti o cuciture saltate.
Devi restituire esclusivamente un JSON valido con lo schema richiesto.`,
    userPromptTemplate: `Ispeziona l'articolo per rilevare qualsiasi imperfezione, segno d'uso o difetto nascosto non menzionato.`
  },
  'custom': {
    id: 'custom',
    name: 'Prompt Personalizzato',
    description: 'Istruzioni custom definite dall\'utente.',
    systemPrompt: `Sei un assistente AI specializzato nell'analisi visiva e documentale di capi di abbigliamento su marketplace online.
Segui fedelmente le istruzioni dell'utente analizzando le foto fornite e i dati dell'annuncio.
Devi restituire esclusivamente un JSON valido con lo schema richiesto.`,
    userPromptTemplate: `Analizza l'articolo secondo le indicazioni personalizzate fornite.`
  }
};

/** Schema JSON di riferimento per Gemini e OpenAI */
export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    brand_rilevato: {
      type: 'string',
      description: 'Nome del brand letto o identificato dalle foto (es. "Nike", "Zara", "Sconosciuto")'
    },
    corrispondenza_dichiarato: {
      type: 'boolean',
      description: 'True se il brand visibile corrisponde a quello dichiarato dal venditore nell\'annuncio'
    },
    taglia_rilevata: {
      type: 'string',
      description: 'Taglia letta su etichetta (es. "M / 48", "US 10", "Non visibile")'
    },
    composizione_materiali: {
      type: 'array',
      items: { type: 'string' },
      description: 'Lista di percentuali e fibre tessili rilevate da etichetta (es. ["100% Lana Vergine", "Fodera: 100% Cupro"])'
    },
    difetti_e_segni_usura: {
      type: 'array',
      items: { type: 'string' },
      description: 'Elenco descrittivo di difetti visibili (es. ["Piccola macchia gialla sul polsino destro", "Pilling moderato sotto le ascelle"]) oppure lista vuota'
    },
    codici_o_seriali: {
      type: 'string',
      description: 'Eventuali codici stile, codici a barre, numeri seriali o RN identificati su etichetta'
    },
    analisi_dettagliata: {
      type: 'string',
      description: 'Valutazione discorsiva completa, motivazioni del punteggio e raccomandazione per l\'acquirente'
    },
    punteggio_affidabilita: {
      type: 'integer',
      minimum: 1,
      maximum: 10,
      description: 'Punteggio da 1 a 10 (1 = contraffatto/difettato gravemente, 10 = autentico, perfetto e totalmente corrispondente)'
    }
  },
  required: [
    'brand_rilevato',
    'corrispondenza_dichiarato',
    'taglia_rilevata',
    'composizione_materiali',
    'difetti_e_segni_usura',
    'analisi_dettagliata',
    'punteggio_affidabilita'
  ]
};

/**
 * Costruisce il prompt contestuale unendo metadati dell'annuncio, preset e istruzioni extra
 */
export function buildPrompt(
  presetId: AnalysisPresetId,
  item: VintedItemData,
  customPrompt?: string,
  additionalNotes?: string
): { systemInstruction: string; userPrompt: string } {
  const preset = ANALYSIS_PRESETS[presetId] || ANALYSIS_PRESETS['full-audit'];

  const detailsFormatted = Object.entries(item.details || {})
    .map(([k, v]) => `  - ${k}: ${v}`)
    .join('\n');

  const itemContext = `
DATI DELL'ANNUNCIO VINTED:
- Titolo: "${item.title}"
- Prezzo: ${item.price} ${item.currency}
- Brand dichiarato: "${item.brand}"
- Taglia dichiarata: "${item.size}"
- Condizioni dichiarate: "${item.condition}"
- Descrizione venditore:
"""
${item.description || 'Nessuna descrizione fornita.'}
"""
- Dettagli aggiuntivi specificati dal venditore:
${detailsFormatted || '  Nessuno'}
- Numero foto fornite: ${item.imageUrls?.length || 0}
`.trim();

  let taskInstruction = preset.userPromptTemplate;
  if (presetId === 'custom' && customPrompt && customPrompt.trim().length > 0) {
    taskInstruction = customPrompt.trim();
  }

  const extraNotes = additionalNotes && additionalNotes.trim().length > 0
    ? `\nNOTE AGGIUNTIVE DELL'UTENTE DA CONSIDERARE CON ALTA PRIORITÀ:\n${additionalNotes.trim()}\n`
    : '';

  const formatRequirement = `
FORMATO DI RISPOSTA OBBLIGATORIO:
Devi rispondere ESCLUSIVAMENTE con un oggetto JSON valido conforme alla seguente struttura, senza alcun testo introduttivo né conclusivo:
{
  "brand_rilevato": "stringa",
  "corrispondenza_dichiarato": true|false,
  "taglia_rilevata": "stringa",
  "composizione_materiali": ["stringa", ...],
  "difetti_e_segni_usura": ["stringa", ...],
  "codici_o_seriali": "stringa o vuoto se assente",
  "analisi_dettagliata": "analisi discorsiva approfondita in lingua italiana",
  "punteggio_affidabilita": 8
}
`.trim();

  const userPrompt = `${itemContext}

OBIETTIVO DI ANALISI:
${taskInstruction}
${extraNotes}

${formatRequirement}`;

  return {
    systemInstruction: preset.systemPrompt,
    userPrompt
  };
}

/**
 * Pulisce e valida la risposta grezza dell'AI assicurando conformità all'interfaccia AnalysisResult
 */
export function parseAndValidateResult(
  rawText: string,
  metadata: {
    providerId: string;
    modelName: string;
    durationMs: number;
    imageCount: number;
  }
): AnalysisResult {
  let cleanText = rawText.trim();

  // Rimuovi blocchi markdown se presenti (es. ```json ... ```)
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = cleanText.match(jsonBlockRegex);
  if (match && match[1]) {
    cleanText = match[1].trim();
  } else {
    // Se ci sono frammenti prima o dopo le graffe, estrai la porzione JSON { ... }
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanText);
  } catch (err) {
    throw new Error(
      `Impossibile parsare la risposta AI come JSON valido. Risposta grezza:\n${rawText.slice(0, 300)}... (Errore: ${(err as Error).message})`
    );
  }

  // Pre-elaborazione & normalizzazione per Zod
  const rawScore = typeof parsed.punteggio_affidabilita === 'number'
    ? Math.round(parsed.punteggio_affidabilita)
    : Number(parsed.punteggio_affidabilita) || 7;
  const clampedScore = Math.max(1, Math.min(10, rawScore));

  const candidate = {
    brand_rilevato: typeof parsed.brand_rilevato === 'string' && parsed.brand_rilevato.trim()
      ? parsed.brand_rilevato.trim()
      : 'Non identificabile',
    corrispondenza_dichiarato: Boolean(parsed.corrispondenza_dichiarato),
    taglia_rilevata: typeof parsed.taglia_rilevata === 'string' && parsed.taglia_rilevata.trim()
      ? parsed.taglia_rilevata.trim()
      : 'Non visibile',
    composizione_materiali: Array.isArray(parsed.composizione_materiali)
      ? parsed.composizione_materiali.map(m => String(m).trim()).filter(Boolean)
      : [],
    difetti_e_segni_usura: Array.isArray(parsed.difetti_e_segni_usura)
      ? parsed.difetti_e_segni_usura.map(d => String(d).trim()).filter(Boolean)
      : [],
    codici_o_seriali: typeof parsed.codici_o_seriali === 'string' && parsed.codici_o_seriali.trim()
      ? parsed.codici_o_seriali.trim()
      : undefined,
    analisi_dettagliata: typeof parsed.analisi_dettagliata === 'string' && parsed.analisi_dettagliata.trim()
      ? parsed.analisi_dettagliata.trim()
      : 'Analisi completata.',
    punteggio_affidabilita: clampedScore,
    rawResponse: rawText,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };

  const validation = AnalysisResultSchema.safeParse(candidate);
  if (!validation.success) {
    console.warn('[Vinted AI Lens] Avvisi di validazione Zod su AnalysisResult:', validation.error.format());
    return candidate as AnalysisResult;
  }

  return validation.data;
}
