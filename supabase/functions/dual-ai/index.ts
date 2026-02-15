import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei un assistente strategico per i social e per la creazione di siti in ottica SEO con un'esperienza di 20 anni nel settore. Ciò che produci deve derivare da uno studio concreto e misurabile.

Struttura l'output in modo sintetico, d'impatto, con testi efficaci che definiscono la strategia senza essere troppo prolissi. Il testo deve essere adatto per essere inserito in una presentazione professionale.

REGOLE DI FORMATTAZIONE FONDAMENTALI:
- Rispondi SEMPRE in italiano.
- Usa un tono professionale ma diretto.
- Formatta l'output in MARKDOWN PURO (titoli ##, ###, tabelle con | e ---, liste, **grassetto**).
- NON usare MAI tag HTML come <b>, <br>, <i>, <strong>, <p>, <div> ecc. Usa SOLO sintassi markdown.
- Per le tabelle, usa il formato markdown standard con | separatori e --- per le intestazioni.
- Per andare a capo, usa semplicemente una riga vuota.`;

const MERGE_SYSTEM_PROMPT = `Sei un editor strategico senior. Il tuo compito è creare un output UNICO e DEFINITIVO partendo da DUE analisi prodotte da due AI diverse (Gemini e ChatGPT).

REGOLE FONDAMENTALI:
1. NON fare una sintesi riduttiva. Devi PRENDERE IL MEGLIO da entrambe le analisi.
2. Se un'analisi ha punti più approfonditi su un tema, usa quelli. Se l'altra ha insight unici, includili.
3. L'output finale deve essere PIÙ RICCO di ciascuna delle due analisi singole, non più povero.
4. Mantieni tabelle, elenchi puntati, struttura chiara.
5. Usa un tono professionale e d'impatto, adatto a una presentazione.
6. Formatta in MARKDOWN PURO con titoli gerarchici (##, ###), tabelle markdown (con | e ---), liste, **bold** per i concetti chiave.
7. NON usare MAI tag HTML (no <b>, <br>, <i>, <strong>, <p>, <div>, ecc.). Solo markdown puro.
8. Rispondi SEMPRE in italiano.
9. NON menzionare mai che stai facendo un merge o che ci sono due fonti. Il risultato deve sembrare un'unica analisi autorevole.
10. Organizza il contenuto in modo logico e visivamente pulito, con sezioni ben separate.
11. Per andare a capo usa una riga vuota, NON <br>.`;

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
      // Strip any HTML tags from the response
      let content = data.choices?.[0]?.message?.content || "";
      content = content.replace(/<\/?[a-zA-Z][^>]*>/g, "");
      
      return {
        content,
        model,
        usage: data.usage,
      };
    };

    // Call both top-tier models in parallel
    const [geminiResult, gptResult] = await Promise.all([
      callModel("google/gemini-2.5-pro"),
      callModel("openai/gpt-5"),
    ]);

    // Auto-merge: take the best from both results
    let merged = null;
    const geminiContent = geminiResult.error ? "" : geminiResult.content;
    const gptContent = gptResult.error ? "" : gptResult.content;

    const availableAnalyses: string[] = [];
    if (geminiContent) availableAnalyses.push(`--- ANALISI A (Gemini) ---\n${geminiContent}`);
    if (gptContent) availableAnalyses.push(`--- ANALISI B (GPT-5) ---\n${gptContent}`);

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

Crea l'output definitivo prendendo il meglio da tutte. NON sintetizzare, ARRICCHISCI. NON usare tag HTML, solo markdown puro.`,
                },
              ],
              stream: false,
            }),
          }
        );

        if (mergeResponse.ok) {
          const mergeData = await mergeResponse.json();
          let mergedContent = mergeData.choices?.[0]?.message?.content || "";
          // Final sanitization: strip any remaining HTML tags
          mergedContent = mergedContent.replace(/<\/?[a-zA-Z][^>]*>/g, "");
          
          merged = {
            content: mergedContent,
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
        content: geminiContent || gptContent || "Errore nella generazione.",
        model: "fallback",
      };
    }

    return new Response(
      JSON.stringify({
        gemini: geminiResult,
        gpt: gptResult,
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
