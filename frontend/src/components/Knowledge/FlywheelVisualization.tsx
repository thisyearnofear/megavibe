import React, { useState, useEffect } from 'react';
import './FlywheelVisualization.css';

interface FlywheelVisualizationProps {
  activeStep: number;
  onStepClick?: (step: number) => void;
}

const FLYWHEEL_STEPS = [
  {
    id: 0,
    title: 'Tips',
    icon: '💰',
    description: 'Audience tips speakers for great content',
    color: '#10B981',
    position: { x: 50, y: 20 }
  },
  {
    id: 1,
    title: 'Bounties',
    icon: '🎯',
    description: 'Tips convert to bounties for specific content',
    color: '#F59E0B',
    position: { x: 80, y: 50 }
  },
  {
    id: 2,
    title: 'Content',
    icon: '📚',
    description: 'Speakers create commissioned content',
    color: '#8B5CF6',
    position: { x: 50, y: 80 }
  },
  {
    id: 3,
    title: 'Revenue',
    icon: '🚀',
    description: 'Quality content generates more tips & bounties',
    color: '#EF4444',
    position: { x: 20, y: 50 }
  }
];

export const FlywheelVisualization: React.FC<FlywheelVisualizationProps> = ({
  activeStep,
  onStepClick
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [flowParticles, setFlowParticles] = useState<Array<{id: number, progress: number}>>([]);

  // Generate flow particles animation
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowParticles(prev => {
        // Update existing particles
        const updated = prev.map(p => ({
          ...p,
          progress: (p.progress + 2) % 400
        })).filter(p => p.progress < 380);

        // Add new particle
        if (Math.random() > 0.7) {
          updated.push({
            id: Date.now(),
            progress: 0
          });
        }

        return updated;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleStepClick = (stepId: number) => {
    if (onStepClick) {
      onStepClick(stepId);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const getStepClassName = (stepId: number) => {
    let className = 'flywheel-step';
    if (stepId === activeStep) className += ' active';
    if (isAnimating) className += ' animating';
    return className;
  };

  return (
    <div className="flywheel-visualization">
      <div className="flywheel-container">
        {/* Central Hub */}
        <div className="flywheel-center">
          <div className="center-content">
            <span className="center-icon">🧠</span>
            <p className="center-label">Knowledge<br/>Economy</p>
          </div>
        </div>

        {/* SVG for connecting lines and flow */}
        <svg className="flywheel-connections" viewBox="0 0 100 100">
          {/* Connection lines */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
          </defs>

          {FLYWHEEL_STEPS.map((step, index) => {
            const nextStep = FLYWHEEL_STEPS[(index + 1) % FLYWHEEL_STEPS.length];
            return (
              <g key={`connection-${index}`}>
                <path
                  d={`M ${step.position.x} ${step.position.y}
                      Q ${(step.position.x + nextStep.position.x) / 2 + 10} ${(step.position.y + nextStep.position.y) / 2}
                      ${nextStep.position.x} ${nextStep.position.y}`}
                  stroke={activeStep === index ? step.color : '#E5E7EB'}
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  className={`connection-line ${activeStep === index ? 'active-connection' : ''}`}
                />
              </g>
            );
          })}

          {/* Flow particles */}
          {flowParticles.map(particle => {
            const currentStepIndex = Math.floor(particle.progress / 100);
            const stepProgress = (particle.progress % 100) / 100;

            if (currentStepIndex >= FLYWHEEL_STEPS.length) return null;

            const currentStep = FLYWHEEL_STEPS[currentStepIndex];
            const nextStep = FLYWHEEL_STEPS[(currentStepIndex + 1) % FLYWHEEL_STEPS.length];

            const x = currentStep.position.x + (nextStep.position.x - currentStep.position.x) * stepProgress;
            const y = currentStep.position.y + (nextStep.position.y - currentStep.position.y) * stepProgress;

            return (
              <circle
                key={particle.id}
                cx={x}
                cy={y}
                r="1.5"
                fill={currentStep.color}
                className="flow-particle"
              />
            );
          })}
        </svg>

        {/* Flywheel Steps */}
        {FLYWHEEL_STEPS.map((step) => (
          <div
            key={step.id}
            className={getStepClassName(step.id)}
            style={{
              left: `${step.position.x}%`,
              top: `${step.position.y}%`,
              borderColor: step.color
            }}
            onClick={() => handleStepClick(step.id)}
          >
            <div className="step-content">
              <span className="step-icon">{step.icon}</span>
              <h4 className="step-title">{step.title}</h4>
            </div>

            {/* Step Details Popup */}
            <div className="step-details" style={{ backgroundColor: step.color }}>
              <p>{step.description}</p>
            </div>

            {/* Active Step Indicator */}
            {step.id === activeStep && (
              <div className="active-indicator" style={{ backgroundColor: step.color }}>
                <div className="pulse-ring"></div>
              </div>
            )}
          </div>
        ))}

        {/* Value Flow Indicators */}
        <div className="value-indicators">
          <div className="value-flow tip-flow">
            <span className="flow-amount">$127</span>
            <span className="flow-label">→ Tips</span>
          </div>
          <div className="value-flow bounty-flow">
            <span className="flow-amount">$450</span>
            <span className="flow-label">→ Bounties</span>
          </div>
        </div>
      </div>

      {/* Active Step Description */}
      <div className="active-step-description">
        <div className="description-content">
          <div className="description-header">
            <span className="description-icon">{FLYWHEEL_STEPS[activeStep].icon}</span>
            <h3>{FLYWHEEL_STEPS[activeStep].title}</h3>
          </div>
          <p>{FLYWHEEL_STEPS[activeStep].description}</p>

          {/* Step-specific metrics */}
          {activeStep === 0 && (
            <div className="step-metrics">
              <div className="metric">
                <span className="metric-value">1,247</span>
                <span className="metric-label">Tips Today</span>
              </div>
              <div className="metric">
                <span className="metric-value">$89,420</span>
                <span className="metric-label">Total Tipped</span>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="step-metrics">
              <div className="metric">
                <span className="metric-value">28</span>
                <span className="metric-label">Active Bounties</span>
              </div>
              <div className="metric">
                <span className="metric-value">$12,450</span>
                <span className="metric-label">Total Rewards</span>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="step-metrics">
              <div className="metric">
                <span className="metric-value">156</span>
                <span className="metric-label">Content Created</span>
              </div>
              <div className="metric">
                <span className="metric-value">95%</span>
                <span className="metric-label">Completion Rate</span>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="step-metrics">
              <div className="metric">
                <span className="metric-value">347%</span>
                <span className="metric-label">Revenue Growth</span>
              </div>
              <div className="metric">
                <span className="metric-value">$50K</span>
                <span className="metric-label">Top Speaker Earnings</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flywheel Performance */}
      <div className="flywheel-performance">
        <h4>Flywheel Velocity</h4>
        <div className="performance-bar">
          <div
            className="performance-fill"
            style={{ width: `${65 + activeStep * 5}%` }}
          ></div>
        </div>
        <p className="performance-text">
          The flywheel is spinning at <strong>{65 + activeStep * 5}%</strong> efficiency
        </p>
      </div>
    </div>
  );
};
