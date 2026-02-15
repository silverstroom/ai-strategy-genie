import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, website } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = website
      ? `Ricerca informazioni sull'azienda "${query}" con sito web: ${website}`
      : `Ricerca informazioni sull'azienda "${query}"`;

    const response = await fetch(
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
            {
              role: "system",
              content: `Sei un assistente che ricerca informazioni sulle aziende italiane. Il tuo compito è trovare dati PRECISI e VERIFICABILI.

ISTRUZIONI CRITICHE PER LA LOCALITÀ:
- Cerca la SEDE OPERATIVA REALE dell'azienda, non indovinare.
- Controlla la Google Business Profile dell'azienda per trovare l'indirizzo esatto.
- Controlla il footer del sito web, la pagina "contatti", "chi siamo", "dove siamo".
- Se il sito ha indicazioni come via, cap, città, usa QUELLE informazioni.
- Per le aziende calabresi, attenzione a distinguere: Lamezia Terme, Catanzaro, Cosenza, Reggio Calabria, Crotone, Vibo Valentia.
- Formato località: "Città, Regione" (es. "Lamezia Terme, Calabria")

ISTRUZIONI PER I SOCIAL:
- Cerca TUTTI i profili social dell'azienda: Facebook, Instagram, LinkedIn, YouTube, TikTok.
- Per Facebook cerca: facebook.com/nomeazienda o la pagina business.
- Per Instagram cerca: instagram.com/nomeazienda
- Per LinkedIn cerca: linkedin.com/company/nomeazienda
- Per YouTube cerca il canale dell'azienda.
- Per TikTok cerca: tiktok.com/@nomeazienda
- Se un social NON esiste, lascia il campo come stringa vuota.
- Inserisci gli URL COMPLETI dei profili trovati.

Rispondi SOLO con un JSON valido, senza markdown o altro testo:
{
  "sector": "settore dell'azienda",
  "location": "città, regione (SEDE REALE verificata)",
  "description": "descrizione sintetica dell'attività (2-3 frasi)",
  "website": "sito web ufficiale",
  "facebook": "URL completo pagina Facebook o stringa vuota",
  "instagram": "URL completo profilo Instagram o stringa vuota",
  "linkedin": "URL completo pagina LinkedIn o stringa vuota",
  "youtube": "URL completo canale YouTube o stringa vuota",
  "tiktok": "URL completo profilo TikTok o stringa vuota",
  "strategyType": "social"
}`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit, riprova tra poco." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crediti esauriti." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Errore AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed: Record<string, string> = {};
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      parsed = {};
    }

    // Build socialLinks string from individual fields for backward compat
    const socialParts = [parsed.facebook, parsed.instagram, parsed.linkedin, parsed.youtube, parsed.tiktok]
      .filter(Boolean);
    if (socialParts.length > 0 && !parsed.socialLinks) {
      parsed.socialLinks = socialParts.join(", ");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("autofill error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
