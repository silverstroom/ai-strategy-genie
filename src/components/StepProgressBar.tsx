import { STRATEGY_STEPS } from "@/lib/strategy-steps";
import { Check } from "lucide-react";

interface StepProgressBarProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export const StepProgressBar = ({ currentStep, completedSteps, onStepClick }: StepProgressBarProps) => {
  return (
    <div className="w-full gradient-navy px-4 py-3 sticky top-0 z-50 shadow-elevated">
      <div className="max-w-7xl mx-auto">
        {/* Progress line + dots */}
        <div className="relative flex items-center justify-between">
          {/* Background line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary-foreground/20 rounded-full" />
          {/* Active line */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 gradient-gold rounded-full transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (STRATEGY_STEPS.length - 1)) * 100}%`,
            }}
          />

          {STRATEGY_STEPS.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className="relative z-10 group flex flex-col items-center gap-1.5"
                title={step.shortTitle}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCurrent
                      ? "bg-accent text-accent-foreground scale-125 shadow-lg ring-2 ring-accent/40"
                      : isCompleted
                      ? "bg-success text-success-foreground"
                      : "bg-primary-foreground/15 text-primary-foreground/50 hover:bg-primary-foreground/25"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5" /> : step.id}
                </div>
                <span
                  className={`text-[10px] font-medium max-w-[60px] text-center leading-tight transition-colors hidden sm:block ${
                    isCurrent
                      ? "text-gold-light"
                      : isCompleted
                      ? "text-primary-foreground/70"
                      : "text-primary-foreground/30"
                  }`}
                >
                  {step.shortTitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
