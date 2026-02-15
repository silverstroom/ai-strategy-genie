export interface ClientInfo {
  name: string;
  sector: string;
  location: string;
  description: string;
  strategyType: "social" | "seo" | "both";
  website?: string;
  socialLinks?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
}

export interface StepDefinition {
  id: number;
  title: string;
  shortTitle: string;
  prompt: string;
}

export interface AIResult {
  content: string;
  model: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  error?: string;
}

export interface StepResult {
  step: number;
  gemini: AIResult;
  gpt: AIResult;
  merged?: AIResult;
  selected?: "gemini" | "gpt";
}

export const STRATEGY_STEPS: StepDefinition[] = [
  {
    id: 1,
    title: "Identità",
    shortTitle: "Identità",
    prompt: `Analizza l'IDENTITÀ del cliente: chi è, cosa fa, come si inserisce nel mercato, posizionamento rispetto ai competitor. Includi: posizionamento percepito, proposta di valore, elementi distintivi evidenziabili online. Sii sintetico e d'impatto, adatto a una slide di presentazione.`,
  },
  {
    id: 2,
    title: "Analisi Social (Presenza Attuale)",
    shortTitle: "Social",
    prompt: `Analizza in modo APPROFONDITO la PRESENZA SOCIAL ATTUALE del cliente.

Per OGNI canale social (Facebook, Instagram, LinkedIn, YouTube, TikTok), crea una sezione dedicata con il nome del canale come titolo (## Facebook, ## Instagram, ecc.).

Per ogni canale analizza TUTTI questi punti in modo dettagliato:

1. **Stato**: Attivo / Non attivo / Inattivo da tempo. Se non presente, indica "Non presente" e suggerisci se ha senso aprirlo per questo tipo di business.
2. **Coerenza Visiva e Tono**: Il profilo ha un'identità visiva coerente? Il tono di voce è adeguato al target? Ci sono incongruenze?
3. **Tipologie di Contenuti**: Che tipo di contenuti pubblica? (foto, video, caroselli, stories, reels, articoli, ecc.) Quali funzionano meglio?
4. **Frequenza di Pubblicazione**: Quanto pubblica? È costante o irregolare? (se deducibile dai dati disponibili)
5. **Qualità e Consistenza**: La qualità dei contenuti è alta, media o bassa? C'è coerenza nel tempo?
6. **Punti Evidenti di Miglioramento**: Cosa dovrebbe migliorare immediatamente su questo canale?
7. **Margine di Sviluppo Strategico**: Come potrebbe sfruttare meglio questo canale per il suo brand? (es. Facebook per raccolta lead su un target specifico, Instagram per brand awareness, LinkedIn per B2B networking, YouTube per tutorial/authority, TikTok per raggiungere Gen Z, ecc.)

IMPORTANTE: Non limitarti a elenchi generici. Fai un'analisi CONCRETA basata sul tipo di business, settore e target del cliente. Ogni punto deve essere specifico e azionabile.

Se un canale non è presente, dedica comunque una sezione spiegando se e perché dovrebbe essere attivato.`,
  },
  {
    id: 3,
    title: "Buyer Personas",
    shortTitle: "Personas",
    prompt: `Definisci 3 BUYER PERSONAS. Per ciascuna persona crea una TABELLA MARKDOWN con 2 colonne (STRUTTURA | DESCRIZIONE DETTAGLIATA) con le seguenti righe:
- Profilo (target, età, situazione)
- Contesto (dove cerca, come si informa)
- Bisogni (cosa cerca, cosa lo preoccupa)
- Motivazione (perché sceglie il servizio/prodotto)
- Messaggio chiave (frase orientata al beneficio)

IMPORTANTE: Usa tabelle markdown standard con | e ---. NON usare mai tag HTML come <br>, <b>, <i> ecc. Separa i concetti usando frasi distinte.`,
  },
  {
    id: 4,
    title: "Competitor",
    shortTitle: "Competitor",
    prompt: `Identifica i COMPETITOR del cliente su 3 livelli. Per ogni livello crea una TABELLA MARKDOWN con 5 colonne e 4 righe di competitor.

## Competitor Nazionali

| Competitor | Canali Attivi | Cosa fanno molto bene sui social | Dove il cliente è potenzialmente migliore | Come il cliente può usare il benchmark |
|---|---|---|---|---|
| Nome 1 | Instagram, Facebook | Dettaglio concreto | Dettaglio concreto | Azione specifica |
| Nome 2 | ... | ... | ... | ... |
| Nome 3 | ... | ... | ... | ... |
| Nome 4 | ... | ... | ... | ... |

## Competitor Regionali

(Stessa struttura tabella 5 colonne x 4 righe)

## Competitor Locali

(Stessa struttura tabella 5 colonne x 4 righe)

REGOLE:
- Usa SEMPRE il formato tabella markdown con | e ---
- Ogni riga deve contenere informazioni CONCRETE e SPECIFICHE, non generiche
- I nomi dei competitor devono essere REALI e verificabili
- La colonna "Come il cliente può usare il benchmark" deve contenere AZIONI OPERATIVE specifiche
- NON usare tag HTML. Solo markdown puro.`,
  },
  {
    id: 5,
    title: "Sintesi Post-Competitor",
    shortTitle: "Sintesi",
    prompt: `Basandoti sull'analisi competitor, fornisci:
1. Una SINTESI di ciò che emerge (punti salienti, direzione strategica prioritaria)
2. I 4 ELEMENTI PRINCIPALI che emergono dal confronto
3. Gli ELEMENTI CHIAVE DELLA STRATEGIA: posizionamento, insight competitivo, differenziazione, focus social
Tutto in modo sintetico e adatto a slide di presentazione. NON usare tag HTML.`,
  },
  {
    id: 6,
    title: "Analisi SWOT",
    shortTitle: "SWOT",
    prompt: `Elabora un'analisi SWOT in formato TABELLA 6x2 markdown. Crea DUE tabelle affiancate logicamente:

**TABELLA 1: Fattori Interni**

| PUNTI DI FORZA | PUNTI DI DEBOLEZZA |
|---|---|
| 1. Titolo — Spiegazione | 1. Titolo — Spiegazione |
| 2. ... | 2. ... |
| 3. ... | 3. ... |
| 4. ... | 4. ... |
| 5. ... | 5. ... |
| 6. ... | 6. ... |

**TABELLA 2: Fattori Esterni**

| OPPORTUNITÀ | MINACCE |
|---|---|
| 1. Titolo — Spiegazione | 1. Titolo — Spiegazione |
| ... | ... |

Ogni punto deve avere un titolo breve in grassetto e una spiegazione sintetica orientata all'azione. NON usare tag HTML.`,
  },
  {
    id: 7,
    title: "Regole Utilizzo Logo",
    shortTitle: "Logo",
    prompt: `Fornisci le REGOLE PER L'UTILIZZO DEL LOGO del cliente in modo visivamente descrittivo:

Per ogni sezione, descrivi con precisione cosa si deve vedere graficamente:

## Versione Master
- Quando e come usarla, su quali sfondi
- Descrivi il posizionamento ideale (centrato, allineato a sinistra, ecc.)

## Versione Negative
- Quando usare il logo in negativo (su sfondo scuro)
- Come deve apparire

## Area di Rispetto
- Definisci lo spazio minimo attorno al logo (es. "almeno 1/4 dell'altezza del logo su ogni lato")
- Esempio pratico visivo

## Dimensioni Minime
- Dimensione minima per stampa e digitale

## Applicazioni Corrette ✓
- Elenca 4-5 utilizzi corretti del logo

## Errori da Evitare ✗
- Elenca 4-5 errori comuni (deformazione, colori sbagliati, sfondo inappropriato, ecc.)

NON usare tag HTML. Usa markdown con emoji e icone testuali per rendere la guida visivamente chiara.`,
  },
  {
    id: 8,
    title: "Colori per i Post (Moodboard)",
    shortTitle: "Colori",
    prompt: `Identifica 4 PALETTE COLORI per la creazione dei post (moodboard digitale).
Per ogni palette indica i codici HEX esatti:
- Sfondo dominante: #XXXXXX (Nome colore)
- Colore accento: #XXXXXX (Nome colore)
- Colore testo: #XXXXXX (Nome colore)
- Destinazione d'uso (post, carosello, rubriche, promo)
- Spiegazione del perché di ogni scelta cromatica

IMPORTANTE: Fornisci SEMPRE i codici esadecimali nel formato #XXXXXX. NON usare tag HTML. Sii specifico per il settore e il brand del cliente.`,
  },
  {
    id: 9,
    title: "Font",
    shortTitle: "Font",
    prompt: `Fornisci consigli FONT per il cliente. TUTTI i font suggeriti devono essere disponibili su Google Fonts.

Per ogni proposta di abbinamento (massimo 3 proposte), indica:

### Proposta X: [Nome Font Titolo] + [Nome Font Corpo]

**Font Titolo:** [Nome esatto su Google Fonts]
- Perché si adatta al brand
- Stile: serif/sans-serif/display/handwriting
- Peso consigliato: (es. Bold 700, SemiBold 600)

**Font Corpo:** [Nome esatto su Google Fonts]  
- Perché funziona in abbinamento
- Stile e peso consigliato per il corpo testo

**Testo di esempio con questo abbinamento:**
> [Scrivi una frase d'esempio che rappresenti il brand del cliente, ad esempio un headline + un paragrafo breve, specificando quale font va usato per cosa]

**Dove usarli:** (social, sito web, presentazioni, ecc.)

IMPORTANTE: Usa SOLO font disponibili su Google Fonts. Indica il nome ESATTO come appare su fonts.google.com. NON usare tag HTML.`,
  },
  {
    id: 10,
    title: "Proposte Video Reel",
    shortTitle: "Reel",
    prompt: `Proponi 4 idee per VIDEO REEL Instagram. Per ogni reel:
- Titolo (es. REEL 1 — "Titolo" Ep.X)
- Obiettivo
- Durata (20-25s)
- Formato: 9:16
- Struttura & timecode (gancio 0-2s, sviluppo, CTA)
- Audio/Musica (indicazione stile)
- Location/oggetti nel video
Basati sull'analisi competitor e sulla strategia emersa. NON usare tag HTML.`,
  },
  {
    id: 11,
    title: "Proposte Post",
    shortTitle: "Post",
    prompt: `Proponi 4 idee di POST derivati dall'analisi competitor e dalla strategia. Per ogni proposta:
- Titolo
- Sottotitolo
- Messaggio (testo del post, sintetico)
- CTA
Concentrati sugli argomenti strategici emersi dall'analisi. NON usare tag HTML.`,
  },
];
