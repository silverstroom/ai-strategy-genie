import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClientInfo } from "@/lib/strategy-steps";
import { Briefcase, MapPin, Globe, Share2, Wand2, Loader2 } from "lucide-react";
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
      const query = [form.name, form.website, form.location].filter(Boolean).join(" - ");
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-autofill`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query }),
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
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Quick Fill row */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4 text-accent" />
            Nome Cliente / Azienda *
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Es. Mario Moniaci System S.R.L."
            required
          />
        </div>
        <Button
          type="button"
          variant="gold"
          onClick={handleAIAutofill}
          disabled={aiLoading || !form.name.trim()}
          className="gap-2 flex-shrink-0 h-10"
        >
          {aiLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          {aiLoading ? "Cerco..." : "Compila con AI"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="sector" className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="h-4 w-4 text-accent" />
            Settore *
          </Label>
          <Input
            id="sector"
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
            placeholder="Es. Attrezzature per il commercio"
            required
          />
        </div>
        <div className="space-y-2 relative" ref={locationRef}>
          <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-accent" />
            Località
          </Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            onFocus={() => form.location.length >= 2 && locationSuggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Es. Catanzaro, Calabria"
            autoComplete="off"
          />
          {showSuggestions && (
            <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {locationSuggestions.map((loc) => (
                <li
                  key={loc}
                  onClick={() => selectLocation(loc)}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent/10 transition-colors"
                >
                  {loc}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-accent" />
            Sito Web
          </Label>
          <Input
            id="website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://www.esempio.it"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="socialLinks" className="flex items-center gap-2 text-sm font-medium">
            <Share2 className="h-4 w-4 text-accent" />
            Link Social
          </Label>
          <Input
            id="socialLinks"
            value={form.socialLinks}
            onChange={(e) => setForm({ ...form, socialLinks: e.target.value })}
            placeholder="facebook.com/..., instagram.com/..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">Descrizione dell'attività *</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descrivi l'attività del cliente, cosa fa, cosa offre, il suo posizionamento..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Tipo di Strategia *</Label>
        <div className="flex gap-3">
          {(["social", "seo", "both"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setForm({ ...form, strategyType: type })}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                form.strategyType === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-card-foreground border-border hover:border-accent"
              }`}
            >
              {type === "social" ? "🎯 Social" : type === "seo" ? "🔍 SEO/Sito" : "📊 Entrambe"}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full text-base">
        Avvia Analisi Strategica
      </Button>
    </form>
  );
};
