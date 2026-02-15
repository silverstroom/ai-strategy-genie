import { useState, useRef, useCallback } from "react";
import { ClientInfo, STRATEGY_STEPS, StepResult } from "@/lib/strategy-steps";
import { StepProgressBar } from "@/components/StepProgressBar";
import { SlidePreview } from "@/components/SlidePreview";
import { DualComparison } from "@/components/DualComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Play, RotateCcw, Loader2, CheckCircle2, Sparkles, Zap, Rocket, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface StrategyWizardProps {
  clientInfo: ClientInfo;
  onReset: () => void;
}

type WizardMode = "idle" | "batch" | "review";
type ReviewView = "slide" | "compare";

export const StrategyWizard = ({ clientInfo, onReset }: StrategyWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [results, setResults] = useState<Record<number, StepResult>>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<WizardMode>("idle");
  const [reviewView, setReviewView] = useState<ReviewView>("slide");
  const [batchStep, setBatchStep] = useState(0);
  const [batchStatus, setBatchStatus] = useState<Record<number, "pending" | "generating" | "done" | "error">>({});
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
    setMode("batch");
    abortRef.current = false;

    const initialStatus: Record<number, "pending" | "generating" | "done" | "error"> = {};
    STRATEGY_STEPS.forEach((s) => { initialStatus[s.id] = "pending"; });
    setBatchStatus(initialStatus);
    setBatchStep(0);

    for (let i = 0; i < STRATEGY_STEPS.length; i++) {
      if (abortRef.current) break;

      const step = STRATEGY_STEPS[i];
      setBatchStep(i + 1);
      setBatchStatus((prev) => ({ ...prev, [step.id]: "generating" }));

      const result = await generateSingleStep(step.id);

      if (result) {
        setResults((prev) => ({ ...prev, [step.id]: result }));
        setBatchStatus((prev) => ({ ...prev, [step.id]: "done" }));
      } else {
        setBatchStatus((prev) => ({ ...prev, [step.id]: "error" }));
      }

      if (i < STRATEGY_STEPS.length - 1 && !abortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    setMode("review");
    setCurrentStep(1);
  };

  const selectResult = (choice: "gemini" | "gpt") => {
    setResults((prev) => ({
      ...prev,
      [currentStep]: { ...prev[currentStep], selected: choice },
    }));
  };

  const progressPercent = mode === "batch"
    ? (batchStep / STRATEGY_STEPS.length) * 100
    : (completedSteps.length / STRATEGY_STEPS.length) * 100;

  // Batch generation view
  if (mode === "batch") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-2xl w-full space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold">
              <Rocket className="h-4 w-4" />
              Generazione in corso
            </div>
            <h1 className="font-serif text-3xl text-foreground">{clientInfo.name}</h1>
            <p className="text-muted-foreground text-sm">
              Analisi strategica completa — Step {batchStep} di {STRATEGY_STEPS.length}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progressPercent} className="h-3 rounded-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avvio</span>
              <span className="font-semibold text-accent">{Math.round(progressPercent)}%</span>
              <span>Completo</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STRATEGY_STEPS.map((step) => {
              const status = batchStatus[step.id] || "pending";
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-500 ${
                    status === "generating"
                      ? "border-accent bg-accent/5 shadow-md shadow-accent/10 scale-[1.02]"
                      : status === "done"
                      ? "border-green-500/30 bg-green-500/5"
                      : status === "error"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border bg-card/50 opacity-50"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                    status === "generating" ? "bg-accent/20"
                      : status === "done" ? "bg-green-500/20"
                      : status === "error" ? "bg-destructive/20"
                      : "bg-muted"
                  }`}>
                    {status === "generating" ? (
                      <Loader2 className="h-4 w-4 text-accent animate-spin" />
                    ) : status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : status === "error" ? (
                      <span className="text-xs text-destructive font-bold">!</span>
                    ) : (
                      <span className="text-xs text-muted-foreground font-mono">{step.id}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      status === "generating" ? "text-accent" : status === "done" ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.shortTitle}
                    </p>
                    {status === "generating" && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> Gemini
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Zap className="h-2.5 w-2.5" /> GPT
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { abortRef.current = true; setMode("review"); }}
              className="text-muted-foreground"
            >
              Interrompi e rivedi i risultati
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
                    Tutti gli 11 step generati in sequenza. Rivedi e seleziona alla fine.
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

  // Review / step-by-step mode
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top progress bar */}
      <StepProgressBar
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setCurrentStep}
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
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 py-8 overflow-y-auto">
        {reviewView === "slide" ? (
          <SlidePreview
            stepId={currentStep}
            result={currentResult}
            clientInfo={clientInfo}
            isLoading={loading}
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
        {reviewView === "slide" && !currentResult && !loading && (
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
            <Button variant="outline" size="sm" onClick={generateStep} disabled={loading} className="gap-1.5">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Rigenera
            </Button>
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
