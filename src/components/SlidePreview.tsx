import { StepResult, STRATEGY_STEPS, ClientInfo } from "@/lib/strategy-steps";
import ReactMarkdown from "react-markdown";
import { Sparkles, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SlidePreviewProps {
  stepId: number;
  result?: StepResult;
  clientInfo: ClientInfo;
  onSelect: (choice: "gemini" | "gpt") => void;
}

export const SlidePreview = ({ stepId, result, clientInfo, onSelect }: SlidePreviewProps) => {
  const stepDef = STRATEGY_STEPS.find((s) => s.id === stepId)!;
  const selected = result?.selected;
  const displayContent = selected ? result?.[selected] : result?.gemini;

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Slide container - 16:9 aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-elevated border border-border bg-card">
          {/* Slide header bar */}
          <div className="gradient-navy px-8 py-5 flex items-center justify-between">
            <div>
              <p className="text-gold-light/60 text-xs font-medium tracking-widest uppercase">
                {clientInfo.name} — Strategia {clientInfo.strategyType === "both" ? "Social & SEO" : clientInfo.strategyType === "social" ? "Social" : "SEO"}
              </p>
              <h2 className="font-serif text-2xl md:text-3xl text-primary-foreground mt-1">
                {stepDef.title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-primary-foreground/40 bg-primary-foreground/10 px-3 py-1 rounded-full">
                {stepId} / {STRATEGY_STEPS.length}
              </span>
            </div>
          </div>

          {/* Slide body */}
          <div className="p-8 overflow-y-auto" style={{ height: "calc(100% - 80px)" }}>
            {!result ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-lg">In attesa di generazione...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Source selector pills */}
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant={selected === "gemini" ? "default" : "outline"}
                    className={`gap-1.5 text-xs rounded-full ${
                      selected === "gemini" ? "gradient-gold text-accent-foreground" : ""
                    }`}
                    onClick={(e) => { e.stopPropagation(); onSelect("gemini"); }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Gemini
                    {selected === "gemini" && <Check className="h-3 w-3 ml-1" />}
                  </Button>
                  <Button
                    size="sm"
                    variant={selected === "gpt" ? "default" : "outline"}
                    className={`gap-1.5 text-xs rounded-full ${
                      selected === "gpt" ? "gradient-gold text-accent-foreground" : ""
                    }`}
                    onClick={(e) => { e.stopPropagation(); onSelect("gpt"); }}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    ChatGPT
                    {selected === "gpt" && <Check className="h-3 w-3 ml-1" />}
                  </Button>
                </div>

                {/* Content */}
                <div className="prose prose-sm md:prose-base max-w-none text-card-foreground prose-headings:font-serif prose-headings:text-foreground prose-strong:text-foreground">
                  <ReactMarkdown>{displayContent?.content || ""}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Slide footer accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-1 gradient-gold" />
        </div>
      </div>
    </div>
  );
};
