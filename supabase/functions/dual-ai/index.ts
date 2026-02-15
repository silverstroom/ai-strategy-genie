import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei un assistente strategico per i social e per la creazione di siti in ottica SEO con un'esperienza di 20 anni nel settore. Ciò che produci deve derivare da uno studio concreto e misurabile.

Struttura l'output in modo sintetico, d'impatto, con testi efficaci che definiscono la strategia senza essere troppo prolissi. Il testo deve essere adatto per essere inserito in una presentazione professionale.

Rispondi SEMPRE in italiano. Usa un tono professionale ma diretto. Formatta l'output in markdown con titoli, tabelle e liste dove appropriato.`;

const MERGE_SYSTEM_PROMPT = `Sei un editor strategico senior. Il tuo compito è creare un output UNICO e DEFINITIVO partendo da TRE analisi prodotte da tre AI diverse (Gemini, ChatGPT e GPT-5.2).

REGOLE FONDAMENTALI:
1. NON fare una sintesi riduttiva. Devi PRENDERE IL MEGLIO da tutte e tre le analisi.
2. Se un'analisi ha punti più approfonditi su un tema, usa quelli. Se un'altra ha insight unici, includili.
3. L'output finale deve essere PIÙ RICCO di ciascuna delle tre analisi singole, non più povero.
4. Mantieni tabelle, elenchi puntati, struttura chiara.
5. Usa un tono professionale e d'impatto, adatto a una presentazione.
6. Formatta in markdown PERFETTO con titoli gerarchici (##, ###), tabelle, liste, bold per i concetti chiave.
7. Rispondi SEMPRE in italiano.
8. NON menzionare mai che stai facendo un merge o che ci sono tre fonti. Il risultato deve sembrare un'unica analisi autorevole.
9. Organizza il contenuto in modo logico e visivamente pulito, con sezioni ben separate.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, step, clientInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `
Informazioni sul cliente:
- Nome: ${clientInfo.name}
- Settore: ${clientInfo.sector}
- Località: ${clientInfo.location}
- Descrizione: ${clientInfo.description}
- Tipo strategia: ${clientInfo.strategyType}
${clientInfo.website ? `- Sito web: ${clientInfo.website}` : ""}
${clientInfo.facebook ? `- Facebook: ${clientInfo.facebook}` : ""}
${clientInfo.instagram ? `- Instagram: ${clientInfo.instagram}` : ""}
${clientInfo.linkedin ? `- LinkedIn: ${clientInfo.linkedin}` : ""}
${clientInfo.youtube ? `- YouTube: ${clientInfo.youtube}` : ""}
${clientInfo.tiktok ? `- TikTok: ${clientInfo.tiktok}` : ""}

${prompt}`;

    const callModel = async (model: string) => {
      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
            ],
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return { error: "Rate limit exceeded, riprova tra poco.", status: 429 };
        }
        if (response.status === 402) {
          return { error: "Crediti esauriti. Aggiungi crediti nel workspace.", status: 402 };
        }
        const t = await response.text();
        console.error(`${model} error:`, response.status, t);
        return { error: `Errore dal modello ${model}`, status: response.status };
      }

      const data = await response.json();
      return {
        content: data.choices?.[0]?.message?.content || "",
        model,
        usage: data.usage,
      };
    };

    // Call all three models in parallel (top-tier reasoning models)
    const [geminiResult, gptResult, gpt52Result] = await Promise.all([
      callModel("google/gemini-2.5-pro"),
      callModel("openai/gpt-5"),
      callModel("openai/gpt-5.2"),
    ]);

    // Auto-merge: take the best from all three results
    let merged = null;
    const geminiContent = geminiResult.error ? "" : geminiResult.content;
    const gptContent = gptResult.error ? "" : gptResult.content;
    const gpt52Content = gpt52Result.error ? "" : gpt52Result.content;

    const availableAnalyses: string[] = [];
    if (geminiContent) availableAnalyses.push(`--- ANALISI A (Gemini) ---\n${geminiContent}`);
    if (gptContent) availableAnalyses.push(`--- ANALISI B (GPT-5 Mini) ---\n${gptContent}`);
    if (gpt52Content) availableAnalyses.push(`--- ANALISI C (GPT-5.2) ---\n${gpt52Content}`);

    if (availableAnalyses.length >= 2) {
      try {
        const mergeResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: MERGE_SYSTEM_PROMPT },
                {
                  role: "user",
                  content: `Ecco le ${availableAnalyses.length} analisi da combinare per lo step "${prompt.slice(0, 100)}":

${availableAnalyses.join("\n\n")}

Crea l'output definitivo prendendo il meglio da tutte. NON sintetizzare, ARRICCHISCI.`,
                },
              ],
              stream: false,
            }),
          }
        );

        if (mergeResponse.ok) {
          const mergeData = await mergeResponse.json();
          merged = {
            content: mergeData.choices?.[0]?.message?.content || "",
            model: "merged",
          };
        }
      } catch (mergeErr) {
        console.error("Merge error:", mergeErr);
      }
    }

    // If merge failed, fallback
    if (!merged) {
      merged = {
        content: geminiContent || gptContent || gpt52Content || "Errore nella generazione.",
        model: "fallback",
      };
    }

    return new Response(
      JSON.stringify({
        gemini: geminiResult,
        gpt: gptResult,
        gpt52: gpt52Result,
        merged,
        step,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("dual-ai error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
