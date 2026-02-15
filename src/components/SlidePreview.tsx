import { StepResult, STRATEGY_STEPS, ClientInfo } from "@/lib/strategy-steps";
import ReactMarkdown from "react-markdown";
import { Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface SlidePreviewProps {
  stepId: number;
  result?: StepResult;
  clientInfo: ClientInfo;
  isLoading?: boolean;
}

export const SlidePreview = ({ stepId, result, clientInfo, isLoading }: SlidePreviewProps) => {
  const stepDef = STRATEGY_STEPS.find((s) => s.id === stepId)!;
  const mergedContent = result?.merged?.content || "";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mergedContent);
      setCopied(true);
      toast.success("Testo copiato negli appunti!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossibile copiare il testo");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
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
            {result && mergedContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="text-xs">{copied ? "Copiato!" : "Copia testo"}</span>
              </Button>
            )}
            <span className="text-xs font-mono text-primary-foreground/40 bg-primary-foreground/10 px-3 py-1.5 rounded-full">
              {stepId} / {STRATEGY_STEPS.length}
            </span>
          </div>
        </div>

        {/* Slide body */}
        <div className="p-8 md:p-12 max-h-[70vh] overflow-y-auto">
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
            <article className="slide-content">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="font-serif text-2xl md:text-3xl text-foreground mt-2 mb-6 pb-3 border-b-2 border-accent/30">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="font-serif text-xl md:text-2xl text-foreground mt-10 mb-4 pb-2 border-b border-border flex items-center gap-2">
                      <span className="inline-block w-1 h-6 rounded-full bg-accent" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-serif text-lg text-accent mt-6 mb-3 font-semibold">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider mt-5 mb-2">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-card-foreground leading-relaxed mb-4 text-sm md:text-base">
                      {children}
                    </p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="space-y-2 mb-6 ml-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="space-y-2 mb-6 ml-1 list-decimal list-inside">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-2.5 text-sm md:text-base text-card-foreground leading-relaxed">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                      <span>{children}</span>
                    </li>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 rounded-xl border border-border overflow-hidden shadow-sm">
                      <table className="w-full text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 border-b border-border text-card-foreground">
                      {children}
                    </td>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-muted/50 transition-colors">{children}</tr>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-accent/40 bg-accent/5 rounded-r-lg pl-5 pr-4 py-3 my-5 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-8 border-border" />,
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-accent">
                      {children}
                    </code>
                  ),
                }}
              >
                {mergedContent}
              </ReactMarkdown>
            </article>
          )}
        </div>

        {/* Slide footer accent line */}
        <div className="h-1.5 gradient-gold" />
      </div>
    </div>
  );
};
