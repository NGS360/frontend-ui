import { Check, X } from "lucide-react";
import React from "react";

export interface Step {
  label: string;
  description?: string;
  content?: React.ReactNode;
  status?: "completed" | "error";
}

interface StepperProps {
  steps: Array<Step>;
  activeStep: number;
  onStepChange?: (step: number) => void;
  className?: string;
  showFutureSteps?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  activeStep,
  onStepChange,
  showFutureSteps = true,
}) => {
  return (
    <div className={`relative`} aria-label="Stepper">
      {steps.map((step, idx) => {
        if (!showFutureSteps && idx > activeStep) return null;
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-row items-start relative">
              {/* Vertical line only between steps, not after last */}
              {idx < steps.length - 1 && (
                <div className="absolute left-4 top-12 w-0.5 bg-accent" style={{ height: 'calc(100% - 2rem)', zIndex: 0 }} />
              )}

              {/* Step circle */}
              <button
                className="relative z-10 mt-0 focus:outline-none ml-0 mr-8"
                style={{ pointerEvents: idx > activeStep ? 'none' : 'auto' }}
                onClick={() => onStepChange && onStepChange(idx)}
                aria-current={idx === activeStep ? 'step' : undefined}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-200
                    ${activeStep >= idx && step.status === 'error'
                      ? 'bg-red-100 border-red-500 text-red-500'
                      : activeStep >= idx && step.status === 'completed'
                      ? 'bg-primary-2 border-primary-2 text-primary-2'
                      : idx === activeStep
                      ? 'bg-primary border-primary text-foreground shadow-lg'
                      : idx < activeStep
                        ? 'bg-primary-2 border-primary-2 text-primary-2'
                        : 'bg-background border-muted-foreground text-muted-foreground'}
                  `}
                >
                  {activeStep >= idx && step.status === 'error' ? (
                    <X className="text-red-500" size={20} />
                  ) : activeStep >= idx && step.status === 'completed' ? (
                    <Check className="text-white" size={20} />
                  ) : idx === activeStep ? (
                    <span className="w-3 h-3 rounded-full bg-background" />
                  ) : idx < activeStep 
                    ? (
                      <Check className="text-white" size={20} />
                    ) : (
                      <span className = "font-bold">{idx + 1}</span>
                    )}
                </span>
              </button>

              {/* Step content */}
              <div className="flex-1">
                <span className={`uppercase font-light text-primary
                  ${activeStep >= idx && step.status === 'error'
                      ? 'text-red-500'
                      : activeStep >= idx && step.status === 'completed'
                      ? 'text-primary-2'
                      : idx === activeStep
                      ? ''
                      : idx < activeStep
                        ? 'text-primary-2'
                      : 'bg-background border-muted-foreground text-muted-foreground'}
                  `}>{step.label}</span>
                {step.description && (
                  <div className="text-sm text-muted-foreground mb-4">{step.description}</div>
                )}
                {step.content && (
                  <div>{step.content}</div>
                )}
              </div>
            </div>

            {/* Spacer between steps, aligns horizontally */}
            {idx < steps.length - 1 && <div className="flex flex-row items-start"><div style={{width: 40}} /><div className="flex-1 min-w-[24rem] mb-8" /></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};
