import { useState } from "react";
import { ClientInfo, STRATEGY_STEPS, StepResult } from "@/lib/strategy-steps";
import { StepSidebar } from "@/components/StepSidebar";
import { DualComparison } from "@/components/DualComparison";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface StrategyWizardProps {
  clientInfo: ClientInfo;
  onReset: () => void;
}

export const StrategyWizard = ({ clientInfo, onReset }: StrategyWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [results, setResults] = useState<Record<number, StepResult>>({});
  const [loading, setLoading] = useState(false);

  const completedSteps = Object.keys(results).map(Number);
  const currentStepDef = STRATEGY_STEPS.find((s) => s.id === currentStep)!;
  const currentResult = results[currentStep];

  const generateStep = async () => {
    setLoading(true);
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
            prompt: currentStepDef.prompt,
            step: currentStep,
            clientInfo,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Errore nella generazione");
      }

      const data = await response.json();
      setResults((prev) => ({
        ...prev,
        [currentStep]: {
          step: currentStep,
          gemini: data.gemini,
          gpt: data.gpt,
        },
      }));
      toast.success(`Step ${currentStep} generato con successo!`);
    } catch (err: any) {
      toast.error(err.message || "Errore nella generazione");
    } finally {
      setLoading(false);
    }
  };

  const selectResult = (choice: "gemini" | "gpt") => {
    setResults((prev) => ({
      ...prev,
      [currentStep]: { ...prev[currentStep], selected: choice },
    }));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card p-4 hidden lg:block">
        <div className="mb-6">
          <h2 className="font-serif text-lg text-foreground">{clientInfo.name}</h2>
          <p className="text-xs text-muted-foreground mt-1">{clientInfo.sector} · {clientInfo.location}</p>
        </div>
        <StepSidebar
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />
        <div className="mt-6 pt-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={onReset} className="w-full justify-start gap-2 text-muted-foreground">
            <RotateCcw className="h-4 w-4" /> Nuovo Cliente
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono bg-accent/10 text-accent px-2 py-1 rounded">
              Step {currentStep} / {STRATEGY_STEPS.length}
            </span>
          </div>
          <h1 className="font-serif text-3xl text-foreground">{currentStepDef.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-2xl">{currentStepDef.prompt.slice(0, 120)}...</p>
        </header>

        {!currentResult && !loading && (
          <Card className="shadow-card max-w-lg">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-6">
                Genera l'analisi per questo step. Entrambe le AI (Gemini + ChatGPT) produrranno il risultato in parallelo.
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
            <div className="flex gap-3">
              {currentResult && (
                <Button variant="outline" size="sm" onClick={generateStep} className="gap-2">
                  <RotateCcw className="h-4 w-4" /> Rigenera
                </Button>
              )}
            </div>
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
