import { useState, useRef, useCallback, useEffect } from "react";
import { ClientInfo, STRATEGY_STEPS, StepResult } from "@/lib/strategy-steps";
import { StepSidebar } from "@/components/StepSidebar";
import { DualComparison } from "@/components/DualComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Play, RotateCcw, Loader2, CheckCircle2, Sparkles, Zap, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface StrategyWizardProps {
  clientInfo: ClientInfo;
  onReset: () => void;
}

type WizardMode = "idle" | "batch" | "review";

export const StrategyWizard = ({ clientInfo, onReset }: StrategyWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [results, setResults] = useState<Record<number, StepResult>>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<WizardMode>("idle");
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

      // Wait 3 seconds before next step (except last)
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
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold">
              <Rocket className="h-4 w-4" />
              Generazione in corso
            </div>
            <h1 className="font-serif text-3xl text-foreground">
              {clientInfo.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Analisi strategica completa — Step {batchStep} di {STRATEGY_STEPS.length}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progressPercent} className="h-3 rounded-full" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Avvio</span>
              <span className="font-semibold text-accent">{Math.round(progressPercent)}%</span>
              <span>Completo</span>
            </div>
          </div>

          {/* Steps grid */}
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
                    status === "generating"
                      ? "bg-accent/20"
                      : status === "done"
                      ? "bg-green-500/20"
                      : status === "error"
                      ? "bg-destructive/20"
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

          {/* Cancel */}
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

  // Idle mode - show "generate all" option
  if (mode === "idle" && completedSteps.length === 0) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-64 flex-shrink-0 border-r border-border bg-card p-4 hidden lg:block">
          <div className="mb-6">
            <h2 className="font-serif text-lg text-foreground">{clientInfo.name}</h2>
            <p className="text-xs text-muted-foreground mt-1">{clientInfo.sector} · {clientInfo.location}</p>
          </div>
          <StepSidebar currentStep={currentStep} completedSteps={completedSteps} onStepClick={setCurrentStep} />
          <div className="mt-6 pt-4 border-t border-border">
            <Button variant="ghost" size="sm" onClick={onReset} className="w-full justify-start gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4" /> Nuovo Cliente
            </Button>
          </div>
        </aside>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <h1 className="font-serif text-3xl text-foreground">Pronto per l'analisi</h1>
              <p className="text-muted-foreground text-sm">
                Scegli come procedere: genera tutto automaticamente o step per step.
              </p>
            </div>

            <div className="grid gap-4">
              {/* Batch generation card */}
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

              {/* Step by step card */}
              <Card
                className="cursor-pointer border-2 border-border hover:border-accent/30 hover:shadow-md transition-all group"
                onClick={generateStep}
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
          </div>
        </main>
      </div>
    );
  }

  // Review mode / step-by-step mode
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card p-4 hidden lg:block">
        <div className="mb-6">
          <h2 className="font-serif text-lg text-foreground">{clientInfo.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">{clientInfo.sector} · {clientInfo.location}</p>
        </div>
        <StepSidebar currentStep={currentStep} completedSteps={completedSteps} onStepClick={setCurrentStep} />
        <div className="mt-6 pt-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onReset} className="w-full justify-start gap-2 text-muted-foreground">
            <RotateCcw className="h-4 w-4" /> Nuovo Cliente
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {mode === "review" && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Generazione completata!</span>{" "}
              Naviga tra gli step e seleziona il risultato migliore per ciascuno (Gemini o GPT).
            </p>
          </div>
        )}

        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded">
              Step {currentStep} / {STRATEGY_STEPS.length}
            </span>
            {currentResult?.selected && (
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded font-medium">
                ✓ {currentResult.selected === "gemini" ? "Gemini" : "GPT"} selezionato
              </span>
            )}
          </div>
          <h1 className="font-serif text-3xl text-foreground">{currentStepDef.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">{currentStepDef.prompt.slice(0, 120)}...</p>
        </header>

        {!currentResult && !loading && (
          <Card className="shadow-card max-w-lg">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-6">
                Genera l'analisi per questo step.
              </p>
              <Button variant="gold" size="lg" onClick={generateStep} className="gap-2">
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

        {currentResult && !loading && (
          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={generateStep} className="gap-2">
              <RotateCcw className="h-4 w-4" /> Rigenera
            </Button>
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Precedente
                </Button>
              )}
              {currentStep < STRATEGY_STEPS.length && (
                <Button variant="gold" onClick={() => setCurrentStep(currentStep + 1)} className="gap-2">
                  Prossimo <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
