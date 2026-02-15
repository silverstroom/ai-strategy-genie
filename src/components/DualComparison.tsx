import { AIResult } from "@/lib/strategy-steps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DualComparisonProps {
  gemini: AIResult;
  gpt: AIResult;
  selected?: "gemini" | "gpt";
  onSelect: (choice: "gemini" | "gpt") => void;
  isLoading?: boolean;
}

export const DualComparison = ({ gemini, gpt, selected, onSelect, isLoading }: DualComparisonProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {["Gemini", "GPT"].map((name) => (
          <Card key={name} className="shadow-card animate-pulse">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-muted" />
                <div className="h-5 w-20 rounded bg-muted" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-4 rounded bg-muted" style={{ width: `${70 + Math.random() * 30}%` }} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gemini */}
      <Card
        className={`shadow-card transition-all cursor-pointer ${
          selected === "gemini"
            ? "ring-2 ring-accent shadow-elevated"
            : "hover:shadow-elevated"
        }`}
        onClick={() => onSelect("gemini")}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Gemini
            </CardTitle>
            {selected === "gemini" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
                <Check className="h-3 w-3" /> Selezionato
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {gemini.error ? (
            <p className="text-destructive text-sm">{gemini.error}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-card-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{gemini.content}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPT */}
      <Card
        className={`shadow-card transition-all cursor-pointer ${
          selected === "gpt"
            ? "ring-2 ring-accent shadow-elevated"
            : "hover:shadow-elevated"
        }`}
        onClick={() => onSelect("gpt")}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-accent" />
              ChatGPT
            </CardTitle>
            {selected === "gpt" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-3 py-1 rounded-full">
                <Check className="h-3 w-3" /> Selezionato
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {gpt.error ? (
            <p className="text-destructive text-sm">{gpt.error}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-card-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{gpt.content}</ReactMarkdown>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
