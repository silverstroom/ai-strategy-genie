import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, openaiKey, googleKey } = await req.json();

    if (action === "get") {
      const { data } = await supabase
        .from("app_settings")
        .select("openai_api_key, google_ai_api_key")
        .eq("id", "default")
        .single();

      const openai = data?.openai_api_key || "";
      const google = data?.google_ai_api_key || "";

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

    if (action === "save") {
      const updates: Record<string, string> = { updated_at: new Date().toISOString() };
      if (openaiKey) updates.openai_api_key = openaiKey;
      if (googleKey) updates.google_ai_api_key = googleKey;

      const { error } = await supabase
        .from("app_settings")
        .update(updates)
        .eq("id", "default");

      if (error) throw error;

      return new Response(
        JSON.stringify({ ok: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_keys") {
      // Internal: return full keys for edge functions
      const { data } = await supabase
        .from("app_settings")
        .select("openai_api_key, google_ai_api_key")
        .eq("id", "default")
        .single();

      return new Response(
        JSON.stringify({
          openaiKey: data?.openai_api_key || "",
          googleKey: data?.google_ai_api_key || "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "test") {
      // Get keys: use provided ones or fall back to DB
      let oaiKey = openaiKey;
      let gKey = googleKey;

      if (!oaiKey || !gKey) {
        const { data } = await supabase
          .from("app_settings")
          .select("openai_api_key, google_ai_api_key")
          .eq("id", "default")
          .single();
        if (!oaiKey) oaiKey = data?.openai_api_key || "";
        if (!gKey) gKey = data?.google_ai_api_key || "";
      }

      const results: Record<string, { ok: boolean; error?: string }> = {};

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
