import React from 'react';

interface FlywheelStepsProps {
  activeStep: number;
}

const STEPS_DATA = [
  {
    id: 0,
    title: 'Tips Flow In',
    icon: '💰',
    description: 'Audience members tip speakers during talks for valuable insights',
    details: [
      'Real-time tips during presentations',
      'Crypto payments via Mantle Network',
      'Instant gratification for speakers',
      'Social proof builds momentum'
    ],
    example: 'Speaker shares ZK-proofs insight → Audience tips $50 → Speaker motivated to share more'
  },
  {
    id: 1,
    title: 'Tips Become Bounties',
    icon: '🎯',
    description: 'Speakers convert earnings into bounties to commission specific content',
    details: [
      'Speakers reinvest 30-50% of tips',
      'Commission follow-up content',
      'Specific deliverables requested',
      'Community-driven content creation'
    ],
    example: 'Speaker earns $200 in tips → Creates $150 bounty for "Advanced ZK Tutorial Video"'
  },
  {
    id: 2,
    title: 'Content Gets Created',
    icon: '📚',
    description: 'Commissioned content gets produced and delivered to the community',
    details: [
      '24-48 hour delivery window',
      '95% completion rate',
      'High-quality specialized content',
      'Knowledge base grows exponentially'
    ],
    example: 'Bounty claimed → 30-min tutorial created → Community gets advanced knowledge'
  },
  {
    id: 3,
    title: 'Revenue Multiplies',
    icon: '🚀',
    description: 'Quality content generates more tips, bounties, and speaking opportunities',
    details: [
      'Content drives 3.4x more tips',
      'Reputation builds across events',
      'Speaking fees increase',
      'Knowledge business scales'
    ],
    example: 'Great content → More conference invites → $50K knowledge business built'
  }
];

export const FlywheelSteps: React.FC<FlywheelStepsProps> = ({ activeStep }) => {
  return (
    <div className="flywheel-steps">
      <div className="steps-header">
        <h2>How the Knowledge Economy Flywheel Works</h2>
        <p>Each step amplifies the next, creating exponential value for knowledge workers</p>
      </div>

      <div className="steps-container">
        {STEPS_DATA.map((step, index) => (
          <div
            key={step.id}
            className={`step-card ${activeStep === step.id ? 'active' : ''}`}
          >
            <div className="step-header">
              <div className="step-number">{index + 1}</div>
              <div className="step-icon">{step.icon}</div>
              <h3 className="step-title">{step.title}</h3>
            </div>

            <div className="step-content">
              <p className="step-description">{step.description}</p>

              <ul className="step-details">
                {step.details.map((detail, detailIndex) => (
                  <li key={detailIndex}>{detail}</li>
                ))}
              </ul>

              <div className="step-example">
                <span className="example-label">Example:</span>
                <p className="example-text">{step.example}</p>
              </div>
            </div>

            {/* Connection Arrow */}
            {index < STEPS_DATA.length - 1 && (
              <div className="step-connector">
                <div className="connector-line"></div>
                <div className="connector-arrow">→</div>
              </div>
            )}

            {/* Active Step Indicator */}
            {activeStep === step.id && (
              <div className="active-step-indicator">
                <div className="indicator-pulse"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Flywheel Cycle Completion */}
      <div className="cycle-completion">
        <div className="completion-arrow">
          <span>🔄</span>
        </div>
        <div className="completion-text">
          <h4>The Cycle Continues</h4>
          <p>Each revolution of the flywheel creates more value, more opportunities, and more success for knowledge workers</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="flywheel-metrics">
        <div className="metrics-header">
          <h4>Flywheel Impact Metrics</h4>
        </div>
        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-icon">⚡</span>
            <span className="metric-value">73%</span>
            <span className="metric-label">Tips → Bounties</span>
          </div>
          <div className="metric-card">
            <span className="metric-icon">🎯</span>
            <span className="metric-value">95%</span>
            <span className="metric-label">Bounty Completion</span>
          </div>
          <div className="metric-card">
            <span className="metric-icon">📈</span>
            <span className="metric-value">3.4x</span>
            <span className="metric-label">Revenue Multiplier</span>
          </div>
          <div className="metric-card">
            <span className="metric-icon">🏆</span>
            <span className="metric-value">$50K</span>
            <span className="metric-label">Top Speaker Earnings</span>
          </div>
        </div>
      </div>
    </div>
  );
};
