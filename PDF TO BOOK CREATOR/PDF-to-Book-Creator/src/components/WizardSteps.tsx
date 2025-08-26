import React from 'react';
import { Badge } from '@/components/ui/badge';
import { WizardStep } from '@/types';
import { Check, Circle, Upload, Layout, Palette, Calculator, Send, Sparkles } from 'lucide-react';

interface WizardStepsProps {
  steps: WizardStep[];
}

const getStepIcon = (stepId: string) => {
  switch (stepId) {
    case 'upload': return Upload;
    case 'template': return Layout;
    case 'cover': return Palette;
    case 'cost': return Calculator;
    case 'submit': return Send;
    default: return Circle;
  }
};

export default function WizardSteps({ steps }: WizardStepsProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, stepIdx) => {
          const StepIcon = getStepIcon(step.id);
          return (
            <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
              {/* Step Content */}
              <div className="flex items-center">
                <div className="flex items-center space-x-4">
                  {/* Step Icon */}
                  <div className="relative">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full border-3 transition-all duration-300 shadow-lg ${
                        step.completed
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-400 to-green-500 transform scale-110'
                          : step.current
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 transform scale-105 shadow-blue-200'
                          : 'border-gray-300 bg-white hover:border-gray-400'
                      }`}
                    >
                      {step.completed ? (
                        <Check className="h-6 w-6 text-white animate-bounce" />
                      ) : (
                        <StepIcon
                          className={`h-6 w-6 transition-colors duration-300 ${
                            step.current ? 'text-blue-600' : 'text-gray-400'
                          }`}
                        />
                      )}
                    </div>
                    {step.current && (
                      <div className="absolute -top-1 -right-1">
                        <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                
                {/* Step Text */}
                <div className="hidden md:block">
                  <p
                    className={`text-sm font-bold transition-colors duration-300 ${
                      step.completed || step.current
                        ? 'text-gray-900'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                </div>
              </div>
            </div>
            
            {/* Connector Line */}
            {stepIdx !== steps.length - 1 && (
              <div className="absolute top-6 left-12 w-full h-1 bg-gray-200 hidden md:block rounded-full">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    step.completed ? 'bg-gradient-to-r from-emerald-400 to-green-500 w-full' : 'bg-gray-200 w-0'
                  }`}
                />
              </div>
            )}
          </li>
          )
        })}
      </ol>
      
      {/* Mobile Step Indicator */}
      <div className="md:hidden mt-6 flex justify-center">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-full shadow-lg">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">
              Étape {steps.findIndex(s => s.current) + 1} sur {steps.length}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}