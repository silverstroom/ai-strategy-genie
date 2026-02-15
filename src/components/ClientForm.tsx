import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClientInfo } from "@/lib/strategy-steps";
import { Briefcase, MapPin, Globe, Share2 } from "lucide-react";

interface ClientFormProps {
  onSubmit: (info: ClientInfo) => void;
}

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sector || !form.description) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-accent" />
            Località
          </Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Es. Catanzaro, Calabria"
          />
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="socialLinks" className="flex items-center gap-2 text-sm font-medium">
          <Share2 className="h-4 w-4 text-accent" />
          Link Social (separati da virgola)
        </Label>
        <Input
          id="socialLinks"
          value={form.socialLinks}
          onChange={(e) => setForm({ ...form, socialLinks: e.target.value })}
          placeholder="https://facebook.com/..., https://instagram.com/..."
        />
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
