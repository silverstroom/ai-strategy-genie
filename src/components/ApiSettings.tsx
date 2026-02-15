import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff, Key, TestTube } from "lucide-react";
import { toast } from "sonner";

interface ApiStatus {
  openai: { ok: boolean; error?: string };
  google: { ok: boolean; error?: string };
}

interface ApiSettingsProps {
  onClose: () => void;
}

export const ApiSettings = ({ onClose }: ApiSettingsProps) => {
  const [openaiKey, setOpenaiKey] = useState("");
  const [googleKey, setGoogleKey] = useState("");
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGoogle, setShowGoogle] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [currentKeys, setCurrentKeys] = useState<{ openai: string; google: string; openaiSet: boolean; googleSet: boolean } | null>(null);
  const [loadingKeys, setLoadingKeys] = useState(true);

  useEffect(() => {
    fetchCurrentKeys();
  }, []);

  const fetchCurrentKeys = async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "get" }),
      });
      if (r.ok) {
        const data = await r.json();
        setCurrentKeys(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingKeys(false);
    }
  };

  const testKeys = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "test",
          openaiKey: openaiKey || undefined,
          googleKey: googleKey || undefined,
        }),
      });
      if (r.ok) {
        const data = await r.json();
        setStatus(data);
        const allOk = data.openai?.ok && data.google?.ok;
        if (allOk) {
          toast.success("Entrambe le API funzionano correttamente!");
        } else {
          toast.error("Alcune API non funzionano. Controlla i dettagli.");
        }
      } else {
        toast.error("Errore nel test delle API");
      }
    } catch {
      toast.error("Errore di connessione");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-elevated border-border animate-fade-in">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Key className="h-5 w-5 text-accent" />
              Impostazioni API
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground">
              ✕
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gestisci le API key per Gemini e ChatGPT. Puoi testarle in qualsiasi momento.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* OpenAI */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center justify-between">
              <span>OpenAI API Key (ChatGPT)</span>
              {status?.openai && (
                status.openai.ok
                  ? <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Funzionante</span>
                  : <span className="flex items-center gap-1 text-xs text-destructive"><XCircle className="h-3.5 w-3.5" /> Errore</span>
              )}
            </Label>
            {currentKeys?.openaiSet && !openaiKey && (
              <p className="text-xs text-muted-foreground">Attuale: <code className="bg-muted px-1 rounded">{currentKeys.openai}</code></p>
            )}
            <div className="relative">
              <Input
                type={showOpenai ? "text" : "password"}
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showOpenai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {status?.openai?.error && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{status.openai.error}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Ottieni la key su <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-accent underline">platform.openai.com</a>
            </p>
          </div>

          {/* Google */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center justify-between">
              <span>Google AI API Key (Gemini)</span>
              {status?.google && (
                status.google.ok
                  ? <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Funzionante</span>
                  : <span className="flex items-center gap-1 text-xs text-destructive"><XCircle className="h-3.5 w-3.5" /> Errore</span>
              )}
            </Label>
            {currentKeys?.googleSet && !googleKey && (
              <p className="text-xs text-muted-foreground">Attuale: <code className="bg-muted px-1 rounded">{currentKeys.google}</code></p>
            )}
            <div className="relative">
              <Input
                type={showGoogle ? "text" : "password"}
                placeholder="AIza..."
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowGoogle(!showGoogle)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showGoogle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {status?.google?.error && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{status.google.error}</p>
            )}
            <p className="text-[11px] text-muted-foreground">
              Ottieni la key su <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-accent underline">aistudio.google.com</a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={testKeys} disabled={testing} className="gap-2 flex-1 gradient-gold text-accent-foreground">
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              Testa connessione
            </Button>
            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            Le API key sono memorizzate in modo sicuro nel backend e non vengono mai esposte nel browser.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
