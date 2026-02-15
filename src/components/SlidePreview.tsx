import { StepResult, STRATEGY_STEPS, ClientInfo } from "@/lib/strategy-steps";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";

interface SlidePreviewProps {
  stepId: number;
  result?: StepResult;
  clientInfo: ClientInfo;
  isLoading?: boolean;
}

export const SlidePreview = ({ stepId, result, clientInfo, isLoading }: SlidePreviewProps) => {
  const stepDef = STRATEGY_STEPS.find((s) => s.id === stepId)!;
  const mergedContent = result?.merged?.content || "";

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Slide container - 16:9 aspect ratio */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-elevated border border-border bg-card">
        {/* Slide header */}
        <div className="gradient-navy px-8 py-6 flex items-center justify-between">
          <div>
            <p className="text-gold-light/60 text-xs font-medium tracking-widest uppercase mb-1">
              {clientInfo.name} — Strategia {clientInfo.strategyType === "both" ? "Social & SEO" : clientInfo.strategyType === "social" ? "Social" : "SEO"}
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-primary-foreground">
              {stepDef.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-primary-foreground/40 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
              {stepId} / {STRATEGY_STEPS.length}
            </span>
          </div>
        </div>

        {/* Slide body */}
        <div className="p-8 md:p-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
              <p className="text-muted-foreground text-sm">Generazione e merge in corso...</p>
            </div>
          ) : !result ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground text-lg">In attesa di generazione...</p>
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base max-w-none text-card-foreground 
              prose-headings:font-serif prose-headings:text-foreground 
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-accent
              prose-strong:text-foreground prose-strong:font-semibold
              prose-li:my-1
              prose-table:border prose-table:border-border prose-table:rounded-lg prose-table:overflow-hidden
              prose-th:bg-muted prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:text-xs prose-th:uppercase prose-th:tracking-wider prose-th:text-muted-foreground prose-th:font-semibold prose-th:border-b prose-th:border-border
              prose-td:px-4 prose-td:py-2.5 prose-td:border-b prose-td:border-border prose-td:text-sm
              prose-p:leading-relaxed
              prose-ul:space-y-1
            ">
              <ReactMarkdown>{mergedContent}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Slide footer accent line */}
        <div className="h-1.5 gradient-gold" />
      </div>
    </div>
  );
};
