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
    prompt: `Analizza la PRESENZA SOCIAL ATTUALE del cliente. Per ogni canale (Facebook, Instagram, LinkedIn, YouTube, TikTok) indica: stato (attivo/non attivo), coerenza visiva e tono, tipologie contenuti, frequenza, qualità/consistenza, punti di miglioramento, margine di sviluppo per il brand. Sii sintetico.`,
  },
  {
    id: 3,
    title: "Buyer Personas",
    shortTitle: "Personas",
    prompt: `Definisci 3 BUYER PERSONAS con questa struttura per ognuna:
- Profilo (target, età, situazione, contesto, bisogni)
- Motivazione (perché cercano il servizio/prodotto, obiettivi, paure, criteri di scelta)
- Messaggio chiave (frase chiara e diretta orientata al beneficio)
Sii concreto e specifico per il settore del cliente.`,
  },
  {
    id: 4,
    title: "Competitor",
    shortTitle: "Competitor",
    prompt: `Identifica COMPETITOR su 3 livelli con tabelle. Per ogni livello (Nazionali, Regionali, Locali) crea una tabella con 4 colonne:
- Competitor
- Cosa fanno molto bene sui social
- Dove il cliente è potenzialmente migliore
- Come il cliente può usare il benchmark
4 righe per ogni gruppo. Ogni riga deve essere concreta e operativa.`,
  },
  {
    id: 5,
    title: "Sintesi Post-Competitor",
    shortTitle: "Sintesi",
    prompt: `Basandoti sull'analisi competitor, fornisci:
1. Una SINTESI di ciò che emerge (punti salienti, direzione strategica prioritaria)
2. I 4 ELEMENTI PRINCIPALI che emergono dal confronto
3. Gli ELEMENTI CHIAVE DELLA STRATEGIA: posizionamento, insight competitivo, differenziazione, focus social
Tutto in modo sintetico e adatto a slide di presentazione.`,
  },
  {
    id: 6,
    title: "Analisi SWOT",
    shortTitle: "SWOT",
    prompt: `Elabora un'analisi SWOT completa con 4 sezioni (6 punti ciascuna):
- Punti di Forza (6 punti)
- Punti di Debolezza (6 punti)
- Opportunità (6 punti)
- Minacce (6 punti)
Ogni punto con titolo breve + spiegazione sintetica orientata all'azione. Coerente con identità, social e competitor.`,
  },
  {
    id: 7,
    title: "Regole Utilizzo Logo",
    shortTitle: "Logo",
    prompt: `Fornisci le REGOLE PER L'UTILIZZO DEL LOGO del cliente:
- Versione Master (quando e come usarla)
- Versione Negative (quando e come usarla)
- Area di Rispetto (regole pratiche)
- Esempi applicativi consigliati
- Errori da evitare
Formatta come guida chiara e professionale.`,
  },
  {
    id: 8,
    title: "Colori per i Post (Moodboard)",
    shortTitle: "Colori",
    prompt: `Identifica 4 PALETTE COLORI per la creazione dei post (moodboard digitale):
Per ogni palette indica:
- Sfondo dominante (hex + nome)
- Colore accento (hex + nome)
- Colore testo (hex + nome)
- Destinazione d'uso (post, carosello, rubriche, promo)
- Spiegazione del perché di ogni scelta cromatica
Sii specifico per il settore e il brand del cliente.`,
  },
  {
    id: 9,
    title: "Font",
    shortTitle: "Font",
    prompt: `Fornisci consigli FONT per il cliente (disponibili su Canva/Google Fonts):
- Font Titolo: nome, perché si adatta al brand
- Font Corpo: nome, perché funziona in abbinamento
- Esempi di utilizzo concreto
Massimo 2-3 proposte di abbinamento.`,
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
Basati sull'analisi competitor e sulla strategia emersa.`,
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
Concentrati sugli argomenti strategici emersi dall'analisi.`,
  },
];
