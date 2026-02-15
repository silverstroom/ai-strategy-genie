import { useState, useRef, useCallback } from "react";
import { ClientInfo, STRATEGY_STEPS, StepResult } from "@/lib/strategy-steps";
import { StepProgressBar } from "@/components/StepProgressBar";
import { SlidePreview } from "@/components/SlidePreview";
import { DualComparison } from "@/components/DualComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Play, RotateCcw, Loader2, Rocket, Presentation, Sparkles, Settings } from "lucide-react";
import { toast } from "sonner";

interface StrategyWizardProps {
  clientInfo: ClientInfo;
  onReset: () => void;
  onOpenApiSettings?: () => void;
}

type WizardMode = "idle" | "review";
type ReviewView = "slide" | "compare";

export const StrategyWizard = ({ clientInfo, onReset, onOpenApiSettings }: StrategyWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [results, setResults] = useState<Record<number, StepResult>>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<WizardMode>("idle");
  const [reviewView, setReviewView] = useState<ReviewView>("slide");
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingStepId, setGeneratingStepId] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const abortRef = useRef(false);

  const completedSteps = Object.keys(results).map(Number);
  const currentStepDef = STRATEGY_STEPS.find((s) => s.id === currentStep)!;
  const currentResult = results[currentStep];

  const generateSingleStep = useCallback(async (stepId: number): Promise<StepResult | null> => {
    const stepDef = STRATEGY_STEPS.find((s) => s.id === stepId)!;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dual-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: stepDef.prompt,
            step: stepId,
            clientInfo,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore nella generazione");
      }

      const data = await response.json();
      
      // Check if both AI models failed (API key issues)
      const bothFailed = data.gemini?.error && data.gpt?.error;
      if (bothFailed) {
        const isQuota = data.gemini.status === 402 || data.gemini.status === 429 || data.gpt.status === 402 || data.gpt.status === 429;
        if (isQuota) {
          toast.error("API key esaurite o non valide. Controlla le impostazioni API.", {
            action: onOpenApiSettings ? {
              label: "Impostazioni API",
              onClick: () => onOpenApiSettings(),
            } : undefined,
            duration: 8000,
          });
        }
      }
      
      return {
        step: stepId,
        gemini: data.gemini,
        gpt: data.gpt,
        merged: data.merged,
      };
    } catch {
      return null;
    }
  }, [clientInfo]);

  const generateStep = async () => {
    setLoading(true);
    try {
      const result = await generateSingleStep(currentStep);
      if (result) {
        setResults((prev) => ({ ...prev, [currentStep]: result }));
        toast.success(`Step ${currentStep} generato con successo!`);
      } else {
        toast.error("Errore nella generazione");
      }
    } finally {
      setLoading(false);
    }
  };

  const startBatchGeneration = async () => {
    // Go to review mode immediately so user can see results as they come in
    setMode("review");
    setCurrentStep(1);
    setIsGeneratingAll(true);
    abortRef.current = false;

    for (let i = 0; i < STRATEGY_STEPS.length; i++) {
      if (abortRef.current) break;

      const step = STRATEGY_STEPS[i];
      setGeneratingStepId(step.id);

      const result = await generateSingleStep(step.id);

      if (result) {
        setResults((prev) => ({ ...prev, [step.id]: result }));
      } else {
        toast.error(`Errore nello step ${step.id}: ${step.shortTitle}`);
      }
    }

    setIsGeneratingAll(false);
    setGeneratingStepId(null);
    toast.success("Analisi completa terminata!");
  };

  const selectResult = (choice: "gemini" | "gpt") => {
    setResults((prev) => ({
      ...prev,
      [currentStep]: { ...prev[currentStep], selected: choice },
    }));
  };

  // Idle mode
  if (mode === "idle" && completedSteps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-lg w-full space-y-6 animate-fade-in">
          <div className="text-center space-y-3">
            <h1 className="font-serif text-3xl text-foreground">Pronto per l'analisi</h1>
            <p className="text-muted-foreground text-sm">
              <span className="font-semibold text-foreground">{clientInfo.name}</span> · {clientInfo.sector} · {clientInfo.location}
            </p>
          </div>

          <div className="grid gap-4">
            <Card
              className="cursor-pointer border-2 border-accent/20 hover:border-accent/50 hover:shadow-lg transition-all group"
              onClick={startBatchGeneration}
            >
              <CardContent className="p-6 flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Rocket className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Genera tutto in automatico</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Tutti gli 11 step generati in sequenza. Rivedi i risultati in tempo reale.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border-2 border-border hover:border-accent/30 hover:shadow-md transition-all group"
              onClick={() => { setMode("review"); }}
            >
              <CardContent className="p-6 flex items-center gap-5">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Procedi step per step</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Genera, confronta e scegli il risultato migliore ad ogni passaggio.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground gap-2">
              <RotateCcw className="h-4 w-4" /> Cambia cliente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Review / step-by-step mode (also used during batch generation)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top progress bar */}
      <StepProgressBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
        generatingStepId={generatingStepId}
        isGeneratingAll={isGeneratingAll}
      />

      {/* Toolbar */}
      <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" /> Nuovo
          </Button>
          <span className="text-xs text-muted-foreground">
            {clientInfo.name} · {clientInfo.sector}
          </span>
          {isGeneratingAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { abortRef.current = true; setIsGeneratingAll(false); setGeneratingStepId(null); }}
              className="text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              Interrompi generazione
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setReviewView("slide")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                reviewView === "slide"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Presentation className="h-3.5 w-3.5" />
              Slide
            </button>
            <button
              onClick={() => setReviewView("compare")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                reviewView === "compare"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Confronta
            </button>
          </div>
          {onOpenApiSettings && (
            <Button variant="ghost" size="sm" onClick={onOpenApiSettings} className="text-muted-foreground gap-1.5">
              <Settings className="h-3.5 w-3.5" /> API
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-8 overflow-y-auto">
        {reviewView === "slide" ? (
          <SlidePreview
            stepId={currentStep}
            result={currentResult}
            clientInfo={clientInfo}
            isLoading={loading || (isGeneratingAll && generatingStepId === currentStep)}
            logoUrl={logoUrl}
            onLogoUpload={setLogoUrl}
            onLogoRemove={() => setLogoUrl(null)}
            onRegenerate={generateStep}
          />
        ) : (
          <div className="max-w-6xl mx-auto px-4">
            <header className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded">
                  Step {currentStep} / {STRATEGY_STEPS.length}
                </span>
                {currentResult?.selected && (
                  <span className="text-xs bg-success/10 text-success px-2 py-1 rounded font-medium">
                    ✓ {currentResult.selected === "gemini" ? "Gemini" : "GPT"} selezionato
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl text-foreground">{currentStepDef.title}</h1>
            </header>

            {!currentResult && !loading && (
              <Card className="shadow-card max-w-lg">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-6">Genera l'analisi per questo step.</p>
                  <Button size="lg" onClick={generateStep} className="gap-2 gradient-gold text-accent-foreground">
                    <Play className="h-5 w-5" /> Genera con Dual AI
                  </Button>
                </CardContent>
              </Card>
            )}

            {(currentResult || loading) && (
              <DualComparison
                gemini={currentResult?.gemini || { content: "", model: "gemini" }}
                gpt={currentResult?.gpt || { content: "", model: "gpt" }}
                selected={currentResult?.selected}
                onSelect={selectResult}
                isLoading={loading}
              />
            )}
          </div>
        )}

        {/* Generate button for slide view when no result */}
        {reviewView === "slide" && !currentResult && !loading && !(isGeneratingAll && generatingStepId === currentStep) && (
          <div className="text-center mt-6">
            <Button size="lg" onClick={generateStep} className="gap-2 gradient-gold text-accent-foreground">
              <Play className="h-5 w-5" /> Genera Step {currentStep}
            </Button>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <div className="border-t border-border bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentResult && (
            <>
              <Button variant="outline" size="sm" onClick={generateStep} disabled={loading || isGeneratingAll} className="gap-1.5">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                Rigenera
              </Button>
              {!isGeneratingAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { startBatchGeneration(); }}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <Rocket className="h-3.5 w-3.5" />
                  Rigenera tutti gli step
                </Button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)} className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" /> Precedente
            </Button>
          )}
          {currentStep < STRATEGY_STEPS.length && (
            <Button size="sm" onClick={() => setCurrentStep(currentStep + 1)} className="gap-1.5 gradient-gold text-accent-foreground">
              Prossimo <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
