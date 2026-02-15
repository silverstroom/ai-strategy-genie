import { useState } from "react";
import { ClientInfo } from "@/lib/strategy-steps";
import { ClientForm } from "@/components/ClientForm";
import { StrategyWizard } from "@/components/StrategyWizard";
import { ApiSettings } from "@/components/ApiSettings";
import { Sparkles, Zap, ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [showApiSettings, setShowApiSettings] = useState(false);

  if (clientInfo) {
    return (
      <>
        <StrategyWizard
          clientInfo={clientInfo}
          onReset={() => setClientInfo(null)}
          onOpenApiSettings={() => setShowApiSettings(true)}
        />
        {showApiSettings && <ApiSettings onClose={() => setShowApiSettings(false)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Settings button */}
      <div className="fixed top-4 right-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowApiSettings(true)}
          className="gap-1.5 bg-card/80 backdrop-blur-sm"
        >
          <Settings className="h-3.5 w-3.5" /> API
        </Button>
      </div>

      {showApiSettings && <ApiSettings onClose={() => setShowApiSettings(false)} />}

      {/* Hero */}
      <header className="gradient-navy py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 bg-accent/20 px-3 py-1.5 rounded-full">
              <Sparkles className="h-4 w-4 text-gold" />
              <span className="text-xs font-medium text-gold-light">Gemini</span>
            </div>
            <span className="text-primary-foreground/40 text-xs">×</span>
            <div className="flex items-center gap-1.5 bg-accent/20 px-3 py-1.5 rounded-full">
              <Zap className="h-4 w-4 text-gold" />
              <span className="text-xs font-medium text-gold-light">ChatGPT</span>
            </div>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-primary-foreground leading-tight mb-4">
            Strategia Social & SEO
            <br />
            <span className="text-gradient-gold">con Dual AI</span>
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
            Due intelligenze artificiali lavorano in parallelo per generare la strategia migliore.
            Confronta, seleziona e costruisci il tuo deck strategico.
          </p>
        </div>
      </header>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: "📋",
                title: "Inserisci i dati",
                desc: "Compila le informazioni del cliente e il tipo di strategia desiderata.",
              },
              {
                icon: "🤖",
                title: "Dual AI Generation",
                desc: "Gemini e ChatGPT generano ogni sezione in parallelo, dal posizionamento ai Reel.",
              },
              {
                icon: "⚖️",
                title: "Confronta e Seleziona",
                desc: "Scegli il risultato migliore per ogni step e costruisci il deck perfetto.",
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-serif text-xl mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-8 px-6 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-xl shadow-elevated p-8 border border-border">
            <div className="flex items-center gap-2 mb-6">
              <ArrowRight className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-2xl text-foreground">Inizia l'Analisi</h2>
            </div>
            <ClientForm onSubmit={setClientInfo} />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
