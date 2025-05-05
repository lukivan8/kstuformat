import React from "react";
import { Check, ArrowRight } from "lucide-react";

interface ProcessStepsProps {
  steps: string[];
  currentStep: number;
}

const ProcessSteps: React.FC<ProcessStepsProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                  index < currentStep
                    ? "bg-green-500 text-white"
                    : index === currentStep
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium text-center ${
                  index === currentStep
                    ? "text-blue-600"
                    : index < currentStep
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-grow flex items-center justify-center px-2">
                <div
                  className={`h-0.5 w-full ${
                    index < currentStep ? "bg-green-500" : "bg-gray-200"
                  }`}
                >
                  <ArrowRight
                    className={`h-4 w-4 ml-auto -mt-2 ${
                      index < currentStep ? "text-green-500" : "text-gray-200"
                    }`}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProcessSteps;
