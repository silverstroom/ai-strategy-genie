import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClientInfo } from "@/lib/strategy-steps";
import {
  Briefcase, MapPin, Globe, Wand2, Loader2, Search,
  Facebook, Instagram, Linkedin, Youtube, Video,
} from "lucide-react";
import { toast } from "sonner";

interface ClientFormProps {
  onSubmit: (info: ClientInfo) => void;
}

const ITALIAN_CITIES = [
  "Roma, Lazio","Milano, Lombardia","Napoli, Campania","Torino, Piemonte","Palermo, Sicilia",
  "Genova, Liguria","Bologna, Emilia-Romagna","Firenze, Toscana","Bari, Puglia","Catania, Sicilia",
  "Venezia, Veneto","Verona, Veneto","Messina, Sicilia","Padova, Veneto","Trieste, Friuli-Venezia Giulia",
  "Brescia, Lombardia","Parma, Emilia-Romagna","Taranto, Puglia","Prato, Toscana","Modena, Emilia-Romagna",
  "Reggio Calabria, Calabria","Reggio Emilia, Emilia-Romagna","Perugia, Umbria","Ravenna, Emilia-Romagna",
  "Livorno, Toscana","Cagliari, Sardegna","Foggia, Puglia","Rimini, Emilia-Romagna","Salerno, Campania",
  "Ferrara, Emilia-Romagna","Sassari, Sardegna","Latina, Lazio","Monza, Lombardia","Siracusa, Sicilia",
  "Pescara, Abruzzo","Bergamo, Lombardia","Forlì, Emilia-Romagna","Trento, Trentino-Alto Adige",
  "Vicenza, Veneto","Terni, Umbria","Bolzano, Trentino-Alto Adige","Novara, Piemonte",
  "Piacenza, Emilia-Romagna","Ancona, Marche","Andria, Puglia","Arezzo, Toscana",
  "Udine, Friuli-Venezia Giulia","Cesena, Emilia-Romagna","Lecce, Puglia","Pesaro, Marche",
  "Barletta, Puglia","Alessandria, Piemonte","La Spezia, Liguria","Pistoia, Toscana",
  "Catanzaro, Calabria","Brindisi, Puglia","Como, Lombardia","Treviso, Veneto","Varese, Lombardia",
  "Cosenza, Calabria","Potenza, Basilicata","Crotone, Calabria","Vibo Valentia, Calabria",
  "Lamezia Terme, Calabria","Matera, Basilicata","Avellino, Campania","Benevento, Campania",
  "Caserta, Campania","Agrigento, Sicilia","Trapani, Sicilia","Ragusa, Sicilia","Enna, Sicilia",
  "Caltanissetta, Sicilia","Campobasso, Molise","Isernia, Molise","L'Aquila, Abruzzo",
  "Chieti, Abruzzo","Teramo, Abruzzo","Aosta, Valle d'Aosta","Nuoro, Sardegna","Oristano, Sardegna",
  "Lucca, Toscana","Massa, Toscana","Grosseto, Toscana","Siena, Toscana","Pisa, Toscana",
  "Mantova, Lombardia","Cremona, Lombardia","Lecco, Lombardia","Lodi, Lombardia","Pavia, Lombardia",
  "Sondrio, Lombardia","Asti, Piemonte","Biella, Piemonte","Cuneo, Piemonte","Verbania, Piemonte",
  "Vercelli, Piemonte","Imperia, Liguria","Savona, Liguria","Belluno, Veneto","Rovigo, Veneto",
  "Gorizia, Friuli-Venezia Giulia","Pordenone, Friuli-Venezia Giulia","Fermo, Marche",
  "Ascoli Piceno, Marche","Macerata, Marche","Frosinone, Lazio","Rieti, Lazio","Viterbo, Lazio",
];

export const ClientForm = ({ onSubmit }: ClientFormProps) => {
  const [form, setForm] = useState<ClientInfo>({
    name: "",
    sector: "",
    location: "",
    description: "",
    strategyType: "social",
    website: "",
    socialLinks: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    youtube: "",
    tiktok: "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLocationChange = (value: string) => {
    setForm({ ...form, location: value });
    if (value.length >= 2) {
      const lower = value.toLowerCase();
      const matches = ITALIAN_CITIES.filter((c) => c.toLowerCase().includes(lower)).slice(0, 8);
      setLocationSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectLocation = (loc: string) => {
    setForm({ ...form, location: loc });
    setShowSuggestions(false);
  };

  const handleAIAutofill = async () => {
    if (!form.name.trim()) {
      toast.error("Inserisci almeno il nome dell'azienda");
      return;
    }

    setAiLoading(true);
    try {
      const query = [form.name, form.location].filter(Boolean).join(" - ");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-autofill`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query, website: form.website || undefined }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore");
      }

      const data = await response.json();

      setForm((prev) => ({
        ...prev,
        sector: data.sector || prev.sector,
        location: data.location || prev.location,
        description: data.description || prev.description,
        website: data.website || prev.website,
        facebook: data.facebook || prev.facebook,
        instagram: data.instagram || prev.instagram,
        linkedin: data.linkedin || prev.linkedin,
        youtube: data.youtube || prev.youtube,
        tiktok: data.tiktok || prev.tiktok,
        socialLinks: data.socialLinks || prev.socialLinks,
        strategyType: data.strategyType || prev.strategyType,
      }));

      toast.success("Campi compilati con AI! Verifica e modifica se necessario.");
    } catch (err: any) {
      toast.error(err.message || "Errore nella compilazione AI");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sector || !form.description) return;
    // Build socialLinks from individual fields
    const links = [form.facebook, form.instagram, form.linkedin, form.youtube, form.tiktok].filter(Boolean).join(", ");
    onSubmit({ ...form, socialLinks: links || form.socialLinks });
  };

  const set = (key: keyof ClientInfo, value: string) => setForm({ ...form, [key]: value });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header / AI Quick Fill */}
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-6 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Search className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ricerca rapida</h3>
            <p className="text-xs text-muted-foreground">Inserisci nome e sito web, l'AI compilerà il resto</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
              Nome Azienda *
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Es. Pino Cerra Acconciature"
              className="bg-background/50"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website-quick" className="text-xs font-medium text-muted-foreground">
              Sito Web (aiuta la precisione)
            </Label>
            <Input
              id="website-quick"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://www.esempio.it"
              className="bg-background/50"
            />
          </div>
          <Button
            type="button"
            variant="gold"
            onClick={handleAIAutofill}
            disabled={aiLoading || !form.name.trim()}
            className="gap-2 h-10 px-6"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {aiLoading ? "Analizzo..." : "Compila con AI"}
          </Button>
        </div>
      </div>

      {/* Info di base */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Briefcase className="h-3.5 w-3.5" /> Informazioni base
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sector" className="text-xs font-medium text-muted-foreground">Settore *</Label>
            <Input
              id="sector"
              value={form.sector}
              onChange={(e) => set("sector", e.target.value)}
              placeholder="Es. Parrucchiere / Hair Salon"
              required
            />
          </div>
          <div className="space-y-1.5 relative" ref={locationRef}>
            <Label htmlFor="location" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> Località
            </Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => handleLocationChange(e.target.value)}
              onFocus={() => form.location.length >= 2 && locationSuggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Es. Lamezia Terme, Calabria"
              autoComplete="off"
            />
            {showSuggestions && (
              <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {locationSuggestions.map((loc) => (
                  <li
                    key={loc}
                    onClick={() => selectLocation(loc)}
                    className="px-3 py-2 text-sm cursor-pointer hover:bg-accent/10 transition-colors flex items-center gap-2"
                  >
                    <MapPin className="h-3 w-3 text-accent flex-shrink-0" />
                    {loc}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3 w-3" /> Sito Web
            </Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://www.esempio.it"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">Descrizione attività *</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Descrivi l'attività: cosa fa, cosa offre, il suo posizionamento..."
            rows={3}
            required
          />
        </div>
      </div>

      {/* Social */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          Canali Social
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {([
            { key: "facebook" as const, icon: Facebook, label: "Facebook", placeholder: "facebook.com/...", color: "text-blue-500" },
            { key: "instagram" as const, icon: Instagram, label: "Instagram", placeholder: "instagram.com/...", color: "text-pink-500" },
            { key: "linkedin" as const, icon: Linkedin, label: "LinkedIn", placeholder: "linkedin.com/company/...", color: "text-sky-600" },
            { key: "youtube" as const, icon: Youtube, label: "YouTube", placeholder: "youtube.com/@...", color: "text-red-500" },
            { key: "tiktok" as const, icon: Video, label: "TikTok", placeholder: "tiktok.com/@...", color: "text-foreground" },
          ]).map(({ key, icon: Icon, label, placeholder, color }) => (
            <div key={key} className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <Input
                value={form[key] || ""}
                onChange={(e) => set(key, e.target.value)}
                placeholder={placeholder}
                className="pl-10 text-xs h-9"
                title={label}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Strategy type */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo di Strategia</h3>
        <div className="grid grid-cols-3 gap-3">
          {([
            { type: "social" as const, emoji: "🎯", label: "Social", desc: "Strategia canali social" },
            { type: "seo" as const, emoji: "🔍", label: "SEO / Sito", desc: "Strategia sito web" },
            { type: "both" as const, emoji: "📊", label: "Entrambe", desc: "Social + SEO" },
          ]).map(({ type, emoji, label, desc }) => (
            <button
              key={type}
              type="button"
              onClick={() => set("strategyType", type)}
              className={`p-4 rounded-xl text-left transition-all border-2 ${
                form.strategyType === type
                  ? "border-accent bg-accent/5 shadow-md shadow-accent/10"
                  : "border-border bg-card hover:border-accent/30"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <p className="text-sm font-semibold mt-1">{label}</p>
              <p className="text-[11px] text-muted-foreground">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full text-base font-semibold">
        🚀 Avvia Analisi Strategica
      </Button>
    </form>
  );
};
