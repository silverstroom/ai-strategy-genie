import { STRATEGY_STEPS } from "@/lib/strategy-steps";
import { Check, Circle, Loader2 } from "lucide-react";

interface StepSidebarProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export const StepSidebar = ({ currentStep, completedSteps, onStepClick }: StepSidebarProps) => {
  return (
    <nav className="space-y-1">
      {STRATEGY_STEPS.map((step) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;

        return (
          <button
            key={step.id}
            onClick={() => onStepClick(step.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left ${
              isCurrent
                ? "bg-primary text-primary-foreground shadow-md"
                : isCompleted
                ? "bg-accent/10 text-foreground hover:bg-accent/20"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <span className="flex-shrink-0">
              {isCompleted ? (
                <Check className="h-4 w-4 text-success" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </span>
            <span className="flex-shrink-0 font-mono text-xs opacity-60">{step.id}.</span>
            <span className="font-medium truncate">{step.shortTitle}</span>
          </button>
        );
      })}
    </nav>
  );
};
