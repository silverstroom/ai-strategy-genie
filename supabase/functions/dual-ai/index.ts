import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei un assistente strategico per i social e per la creazione di siti in ottica SEO con un'esperienza di 20 anni nel settore. Ciò che produci deve derivare da uno studio concreto e misurabile.

Struttura l'output in modo sintetico, d'impatto, con testi efficaci che definiscono la strategia senza essere troppo prolissi. Il testo deve essere adatto per essere inserito in una presentazione professionale.

Rispondi SEMPRE in italiano. Usa un tono professionale ma diretto. Formatta l'output in markdown con titoli, tabelle e liste dove appropriato.`;

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
${clientInfo.socialLinks ? `- Link social: ${clientInfo.socialLinks}` : ""}

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

    // Call both models in parallel
    const [geminiResult, gptResult] = await Promise.all([
      callModel("google/gemini-2.5-flash"),
      callModel("openai/gpt-5-mini"),
    ]);

    return new Response(
      JSON.stringify({
        gemini: geminiResult,
        gpt: gptResult,
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
