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
    const { action, openaiKey, googleKey } = await req.json();

    if (action === "get") {
      const openai = Deno.env.get("OPENAI_API_KEY") || "";
      const google = Deno.env.get("GOOGLE_AI_API_KEY") || "";
      return new Response(
        JSON.stringify({
          openai: openai ? `${openai.slice(0, 8)}...${openai.slice(-4)}` : "",
          google: google ? `${google.slice(0, 8)}...${google.slice(-4)}` : "",
          openaiSet: !!openai,
          googleSet: !!google,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "test") {
      const results: Record<string, { ok: boolean; error?: string }> = {};

      // Test OpenAI
      const oaiKey = openaiKey || Deno.env.get("OPENAI_API_KEY");
      if (oaiKey) {
        try {
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${oaiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: "Rispondi solo: OK" }],
              max_tokens: 5,
            }),
          });
          if (r.ok) {
            const d = await r.json();
            results.openai = { ok: true };
          } else {
            const t = await r.text();
            results.openai = { ok: false, error: `HTTP ${r.status}: ${t.slice(0, 200)}` };
          }
        } catch (e) {
          results.openai = { ok: false, error: e.message };
        }
      } else {
        results.openai = { ok: false, error: "API Key non configurata" };
      }

      // Test Google
      const gKey = googleKey || Deno.env.get("GOOGLE_AI_API_KEY");
      if (gKey) {
        try {
          const r = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${gKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "Rispondi solo: OK" }] }],
                generationConfig: { maxOutputTokens: 5 },
              }),
            }
          );
          if (r.ok) {
            const d = await r.json();
            results.google = { ok: true };
          } else {
            const t = await r.text();
            results.google = { ok: false, error: `HTTP ${r.status}: ${t.slice(0, 200)}` };
          }
        } catch (e) {
          results.google = { ok: false, error: e.message };
        }
      } else {
        results.google = { ok: false, error: "API Key non configurata" };
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Azione non valida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
