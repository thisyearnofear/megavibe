import React from 'react';
import './StepWizard.css';

interface Step {
  key: string;
  label: string;
  icon?: string;
}

interface StepWizardProps {
  steps: Step[];
  activeKey: string;
  completedKeys?: string[];
  className?: string;
}

export const StepWizard: React.FC<StepWizardProps> = ({ 
  steps, 
  activeKey, 
  completedKeys = [],
  className = ''
}) => {
  const getStepStatus = (stepKey: string, index: number) => {
    if (completedKeys.includes(stepKey)) return 'completed';
    if (stepKey === activeKey) return 'active';
    
    // Check if this step comes before the active step
    const activeIndex = Array.isArray(steps) ? steps.findIndex(s => s.key === activeKey) : -1;
    if (index < activeIndex) return 'completed';
    
    return 'pending';
  };

  return (
    <div className={`step-wizard ${className}`}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.key, index);
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.key} className="step-container">
            <div className={`step-item step-${status}`}>
              <div className="step-indicator">
                {status === 'completed' ? (
                  <span className="step-check">✓</span>
                ) : step.icon ? (
                  <span className="step-icon">{step.icon}</span>
                ) : (
                  <span className="step-number">{index + 1}</span>
                )}
              </div>
              <div className="step-content">
                <span className="step-label">{step.label}</span>
              </div>
            </div>
            
            {!isLast && (
              <div className={`step-connector step-connector-${status}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StepWizard;
