import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { prompt, step, clientInfo, openaiKey, googleKey } = await req.json();

    // Get keys: prioritize passed keys, then DB, then env
    let OPENAI_API_KEY = openaiKey || "";
    let GOOGLE_AI_API_KEY = googleKey || "";

    if (!OPENAI_API_KEY || !GOOGLE_AI_API_KEY) {
      try {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        const { data } = await supabase
          .from("app_settings")
          .select("openai_api_key, google_ai_api_key")
          .eq("id", "default")
          .single();
        if (!OPENAI_API_KEY) OPENAI_API_KEY = data?.openai_api_key || "";
        if (!GOOGLE_AI_API_KEY) GOOGLE_AI_API_KEY = data?.google_ai_api_key || "";
      } catch {}
    }

    if (!OPENAI_API_KEY) OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
    if (!GOOGLE_AI_API_KEY) GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY") || "";
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY non configurata");
    if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY non configurata");

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

    // Call Gemini via Google AI API
    const callGemini = async () => {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error("Gemini error:", response.status, errText);
          return { error: `Errore Gemini (${response.status})`, status: response.status };
        }

        const data = await response.json();
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        content = content.replace(/<\/?[a-zA-Z][^>]*>/g, "");
        
        return {
          content,
          model: "gemini-2.5-pro",
          usage: {
            prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
            completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: data.usageMetadata?.totalTokenCount || 0,
          },
        };
      } catch (err) {
        console.error("Gemini call failed:", err);
        return { error: `Errore Gemini: ${err.message}`, status: 500 };
      }
    };

    // Call GPT via OpenAI API
    const callGPT = async () => {
      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.7,
              max_tokens: 4096,
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error("GPT error:", response.status, errText);
          return { error: `Errore GPT (${response.status})`, status: response.status };
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";
        content = content.replace(/<\/?[a-zA-Z][^>]*>/g, "");
        
        return {
          content,
          model: "gpt-4o",
          usage: data.usage,
        };
      } catch (err) {
        console.error("GPT call failed:", err);
        return { error: `Errore GPT: ${err.message}`, status: 500 };
      }
    };

    // Call both models in parallel
    const [geminiResult, gptResult] = await Promise.all([
      callGemini(),
      callGPT(),
    ]);

    // Auto-merge: take the best from both results
    let merged = null;
    const geminiContent = geminiResult.error ? "" : geminiResult.content;
    const gptContent = gptResult.error ? "" : gptResult.content;

    const availableAnalyses: string[] = [];
    if (geminiContent) availableAnalyses.push(`--- ANALISI A (Gemini) ---\n${geminiContent}`);
    if (gptContent) availableAnalyses.push(`--- ANALISI B (GPT) ---\n${gptContent}`);

    if (availableAnalyses.length >= 2) {
      try {
        // Use Gemini Flash for merge (cheaper/faster)
        const mergeResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{
                    text: `${MERGE_SYSTEM_PROMPT}\n\nEcco le ${availableAnalyses.length} analisi da combinare per lo step "${prompt.slice(0, 100)}":\n\n${availableAnalyses.join("\n\n")}\n\nCrea l'output definitivo prendendo il meglio da tutte. NON sintetizzare, ARRICCHISCI. NON usare tag HTML, solo markdown puro.`,
                  }],
                },
              ],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 8192,
              },
            }),
          }
        );

        if (mergeResponse.ok) {
          const mergeData = await mergeResponse.json();
          let mergedContent = mergeData.candidates?.[0]?.content?.parts?.[0]?.text || "";
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

    // Fallback
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
